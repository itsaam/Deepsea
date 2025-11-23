const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Middleware pour vérifier si l'utilisateur a une restriction de commentaires
 */
const checkCommentRestriction = async (req, res, next) => {
  try {
    // Les admins ne sont jamais restreints
    if (req.user.role === "ADMIN") {
      return next();
    }

    const userId = req.user.id;

    // Vérifier s'il y a une restriction de commentaires active
    const commentRestriction = await prisma.userSanction.findFirst({
      where: {
        userId: userId,
        type: "COMMENT_RESTRICTION",
        active: true,
        OR: [
          { expiresAt: null }, // Restriction permanente
          { expiresAt: { gt: new Date() } }, // Restriction encore active
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (commentRestriction) {
      const now = new Date();
      const expiresAt = commentRestriction.expiresAt;

      // Si la restriction a expiré, la désactiver
      if (expiresAt && expiresAt <= now) {
        await prisma.userSanction.update({
          where: { id: commentRestriction.id },
          data: { active: false },
        });
        return next();
      }

      // Calculer le temps restant
      const timeRemaining = expiresAt ? expiresAt - now : null;
      const daysRemaining = timeRemaining
        ? Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
        : null;

      return res.status(403).json({
        error: "COMMENT_RESTRICTED",
        sanctionType: "COMMENT_RESTRICTION",
        reason: commentRestriction.reason,
        expiresAt: commentRestriction.expiresAt,
        daysRemaining,
        issuedAt: commentRestriction.createdAt,
        message: expiresAt
          ? `Vous ne pouvez pas commenter pendant encore ${daysRemaining} jour(s). Raison: ${commentRestriction.reason}`
          : `Vous ne pouvez plus commenter. Raison: ${commentRestriction.reason}`,
      });
    }

    next();
  } catch (error) {
    console.error("❌ Erreur checkCommentRestriction:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur a une restriction de contenu (création d'espèces)
 */
const checkContentRestriction = async (req, res, next) => {
  try {
    // Les admins ne sont jamais restreints
    if (req.user.role === "ADMIN") {
      return next();
    }

    const userId = req.user.id;

    // Vérifier s'il y a une restriction de contenu active
    const contentRestriction = await prisma.userSanction.findFirst({
      where: {
        userId: userId,
        type: "CONTENT_RESTRICTION",
        active: true,
        OR: [
          { expiresAt: null }, // Restriction permanente
          { expiresAt: { gt: new Date() } }, // Restriction encore active
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (contentRestriction) {
      const now = new Date();
      const expiresAt = contentRestriction.expiresAt;

      // Si la restriction a expiré, la désactiver
      if (expiresAt && expiresAt <= now) {
        await prisma.userSanction.update({
          where: { id: contentRestriction.id },
          data: { active: false },
        });
        return next();
      }

      // Calculer le temps restant
      const timeRemaining = expiresAt ? expiresAt - now : null;
      const daysRemaining = timeRemaining
        ? Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
        : null;

      return res.status(403).json({
        error: "CONTENT_RESTRICTED",
        sanctionType: "CONTENT_RESTRICTION",
        reason: contentRestriction.reason,
        expiresAt: contentRestriction.expiresAt,
        daysRemaining,
        issuedAt: contentRestriction.createdAt,
        message: expiresAt
          ? `Vous ne pouvez pas créer de contenu pendant encore ${daysRemaining} jour(s). Raison: ${contentRestriction.reason}`
          : `Vous ne pouvez plus créer de contenu. Raison: ${contentRestriction.reason}`,
      });
    }

    next();
  } catch (error) {
    console.error("❌ Erreur checkContentRestriction:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = {
  checkCommentRestriction,
  checkContentRestriction,
};
