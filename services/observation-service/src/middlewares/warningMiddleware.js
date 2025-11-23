const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const notificationService = require("../services/notificationService");
const axios = require("axios");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

// Helper pour récupérer les infos utilisateur
async function getUserInfo(userId) {
  try {
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/internal/user/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur récupération user ${userId}:`, error.message);
    return null;
  }
}

/**
 * Middleware pour vérifier les warnings actifs et appliquer des restrictions automatiques
 *
 * ESCALADE AUTOMATIQUE :
 * - 3+ warnings LOW → Restriction commentaires 7 jours
 * - 2+ warnings MEDIUM → Restriction contenu 14 jours
 * - 1+ warning HIGH → Suspension temporaire 3 jours
 * - 1+ warning CRITICAL → Ban permanent automatique
 */
const checkActiveWarnings = async (req, res, next) => {
  try {
    // Les admins ne sont jamais affectés
    if (req.user.role === "ADMIN") {
      return next();
    }

    const userId = req.user.id;

    // Récupérer tous les warnings actifs
    const activeWarnings = await prisma.warning.findMany({
      where: {
        userId: userId,
        active: true,
        OR: [
          { expiresAt: null }, // Warnings permanents
          { expiresAt: { gt: new Date() } }, // Warnings encore valides
        ],
      },
      orderBy: { severity: "desc" },
    });

    if (activeWarnings.length === 0) {
      return next();
    }

    // Désactiver les warnings expirés
    const now = new Date();
    for (const warning of activeWarnings) {
      if (warning.expiresAt && warning.expiresAt <= now) {
        await prisma.warning.update({
          where: { id: warning.id },
          data: { active: false },
        });
      }
    }

    // Recompter les warnings actifs par sévérité
    const validWarnings = activeWarnings.filter(
      (w) => !w.expiresAt || w.expiresAt > now
    );

    if (validWarnings.length === 0) {
      return next();
    }

    const criticalCount = validWarnings.filter(
      (w) => w.severity === "CRITICAL"
    ).length;
    const highCount = validWarnings.filter((w) => w.severity === "HIGH").length;
    const mediumCount = validWarnings.filter(
      (w) => w.severity === "MEDIUM"
    ).length;
    const lowCount = validWarnings.filter((w) => w.severity === "LOW").length;

    // 🔴 CRITICAL : Ban permanent automatique
    if (criticalCount >= 1) {
      const existingBan = await prisma.userSanction.findFirst({
        where: {
          userId,
          type: "PERMANENT_BAN",
          active: true,
        },
      });

      if (!existingBan) {
        const warning = validWarnings.find((w) => w.severity === "CRITICAL");
        const issuerInfo = await getUserInfo(warning.issuedBy);

        await prisma.userSanction.create({
          data: {
            userId,
            type: "PERMANENT_BAN",
            reason: `Escalade automatique : Warning CRITICAL (${warning.reason})`,
            issuedBy: warning.issuedBy,
          },
        });

        await notificationService.createNotification(
          userId,
          "ACCOUNT_BANNED",
          "🔴 Compte Banni Définitivement",
          `Votre compte a été automatiquement banni suite à un avertissement CRITICAL émis par ${
            issuerInfo?.username || `Admin #${warning.issuedBy}`
          }.\n\nRaison: ${warning.reason}`,
          null
        );

        return res.status(403).json({
          error: "ACCOUNT_BANNED",
          message:
            "Votre compte a été banni automatiquement suite à un avertissement critique",
          warnings: validWarnings.length,
        });
      }

      // Si ban existe déjà, bloquer quand même
      return res.status(403).json({
        error: "ACCOUNT_BANNED",
        message: "Votre compte est banni définitivement",
        warnings: validWarnings.length,
      });
    }

    // 🟠 HIGH : Suspension temporaire 3 jours
    if (highCount >= 1) {
      const existingSuspension = await prisma.userSanction.findFirst({
        where: {
          userId,
          type: "TEMPORARY_SUSPENSION",
          active: true,
          expiresAt: { gt: new Date() },
        },
      });

      if (!existingSuspension) {
        const warning = validWarnings.find((w) => w.severity === "HIGH");
        const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 jours

        await prisma.userSanction.create({
          data: {
            userId,
            type: "TEMPORARY_SUSPENSION",
            reason: `Escalade automatique : Warning HIGH (${warning.reason})`,
            issuedBy: warning.issuedBy,
            expiresAt,
          },
        });

        await notificationService.createNotification(
          userId,
          "ACCOUNT_SUSPENDED",
          "⏸️ Compte suspendu",
          `Votre compte a été suspendu pendant 3 jours suite à un avertissement sévère.`,
          null
        );

        return res.status(403).json({
          error: "ACCOUNT_SUSPENDED",
          message:
            "Votre compte a été suspendu pendant 3 jours suite à un avertissement sévère",
          expiresAt,
          warnings: validWarnings.length,
        });
      }
    }

    // 🟡 MEDIUM : 2+ warnings → Restriction contenu 14 jours
    if (mediumCount >= 2) {
      const existingRestriction = await prisma.userSanction.findFirst({
        where: {
          userId,
          type: "CONTENT_RESTRICTION",
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (!existingRestriction) {
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 jours

        await prisma.userSanction.create({
          data: {
            userId,
            type: "CONTENT_RESTRICTION",
            reason: `Escalade automatique : ${mediumCount} warnings MEDIUM`,
            issuedBy: validWarnings[0].issuedBy,
            expiresAt,
          },
        });

        await notificationService.createNotification(
          userId,
          "WARNING_RECEIVED",
          "🚫 Restriction de création de contenu",
          `Vous ne pouvez plus créer d'espèces pendant 14 jours suite à ${mediumCount} avertissements.`,
          null
        );

        return res.status(403).json({
          error: "CONTENT_RESTRICTED",
          message: `Restriction de création de contenu pendant 14 jours (${mediumCount} warnings MEDIUM)`,
          expiresAt,
          warnings: validWarnings.length,
        });
      }
    }

    // 🟢 LOW : 3+ warnings → Restriction commentaires 7 jours
    if (lowCount >= 3) {
      const existingRestriction = await prisma.userSanction.findFirst({
        where: {
          userId,
          type: "COMMENT_RESTRICTION",
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (!existingRestriction) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

        await prisma.userSanction.create({
          data: {
            userId,
            type: "COMMENT_RESTRICTION",
            reason: `Escalade automatique : ${lowCount} warnings LOW`,
            issuedBy: validWarnings[0].issuedBy,
            expiresAt,
          },
        });

        await notificationService.createNotification(
          userId,
          "WARNING_RECEIVED",
          "🚫 Restriction de commentaires",
          `Vous ne pouvez plus commenter pendant 7 jours suite à ${lowCount} avertissements.`,
          null
        );

        return res.status(403).json({
          error: "COMMENT_RESTRICTED",
          message: `Restriction de commentaires pendant 7 jours (${lowCount} warnings LOW)`,
          expiresAt,
          warnings: validWarnings.length,
        });
      }
    }

    // Si des warnings mais pas assez pour escalade, on passe
    // Mais on pourrait ajouter un header pour informer
    res.setHeader("X-Active-Warnings", validWarnings.length);
    next();
  } catch (error) {
    // En cas d'erreur, on laisse passer pour ne pas bloquer le service
    next();
  }
};

module.exports = {
  checkActiveWarnings,
};
