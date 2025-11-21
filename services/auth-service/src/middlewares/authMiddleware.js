const { signToken, verifyToken } = require("../config/jwt");
const prisma = require("../../prismaClient");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "En-tête Authorization manquant" });
  }

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Format Authorization invalide" });
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("Erreur JWT:", err);
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

module.exports = {
  signToken,
  authMiddleware,
};
