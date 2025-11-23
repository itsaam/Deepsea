const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Format de token invalide" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded.sub || decoded.userId;

    req.user = {
      id: userId,
      role: decoded.role,
      email: decoded.email,
      username: decoded.username,
    };

    // ✅ Vérifier les sanctions actives (sauf pour les admins)
    if (decoded.role !== "ADMIN") {
      const activeSanctions = await prisma.userSanction.findMany({
        where: {
          userId: userId,
          active: true,
          OR: [
            { expiresAt: null }, // Ban permanent
            { expiresAt: { gt: new Date() } }, // Suspension encore active
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      if (activeSanctions.length > 0) {
        const sanction = activeSanctions[0];

        if (sanction.type === "PERMANENT_BAN") {
          return res.status(403).json({
            error: "ACCOUNT_BANNED",
            sanctionType: "PERMANENT_BAN",
            reason: sanction.reason,
            issuedAt: sanction.createdAt,
          });
        }

        if (sanction.type === "TEMPORARY_SUSPENSION") {
          const now = new Date();
          const expiresAt = new Date(sanction.expiresAt);

          if (expiresAt > now) {
            const timeRemaining = expiresAt - now;
            const daysRemaining = Math.ceil(
              timeRemaining / (1000 * 60 * 60 * 24)
            );
            const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

            return res.status(403).json({
              error: "ACCOUNT_SUSPENDED",
              sanctionType: "TEMPORARY_SUSPENSION",
              reason: sanction.reason,
              expiresAt: sanction.expiresAt,
              daysRemaining,
              hoursRemaining,
              issuedAt: sanction.createdAt,
            });
          } else {
            // La suspension a expiré, la désactiver
            await prisma.userSanction.update({
              where: { id: sanction.id },
              data: { active: false },
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
};

module.exports = authMiddleware;
