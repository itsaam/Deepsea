const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const checkSanctions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Chercher des sanctions actives pour cet utilisateur
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

    next();
  } catch (error) {
    console.error("❌ Erreur checkSanctions:", error);
    next();
  }
};

module.exports = checkSanctions;
