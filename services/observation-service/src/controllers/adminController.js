const { PrismaClient } = require("@prisma/client");
const notificationService = require("../services/notificationService");
const {
  recupererInfosUtilisateur: getUserInfo,
  viderCacheUtilisateur,
} = require("../../../../shared/utils/authServiceClient");
const prisma = new PrismaClient();

const adminController = {
  // 📊 Dashboard - Statistiques globales
  async getDashboard(req, res) {
    try {
      const [
        totalObservations,
        pendingObservations,
        validatedObservations,
        rejectedObservations,
        totalReplies,
        totalSpecies,
        activeWarnings,
        activeSanctions,
      ] = await Promise.all([
        prisma.observation.count({ where: { deleted: false } }),
        prisma.observation.count({
          where: { status: "PENDING", deleted: false },
        }),
        prisma.observation.count({
          where: { status: "VALIDATED", deleted: false },
        }),
        prisma.observation.count({
          where: { status: "REJECTED", deleted: false },
        }),
        prisma.reply.count({ where: { deleted: false } }),
        prisma.species.count({ where: { deleted: false } }),
        prisma.warning.count({ where: { active: true } }),
        prisma.userSanction.count({ where: { active: true } }),
      ]);

      // Observations récentes
      const recentObservations = await prisma.observation.findMany({
        where: { deleted: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          species: { select: { name: true } },
        },
      });

      // Récupérer les infos des auteurs
      const observationsWithAuthors = await Promise.all(
        recentObservations.map(async (obs) => {
          const author = await getUserInfo(obs.authorId);
          return {
            ...obs,
            author: author
              ? { username: author.username }
              : { username: "Inconnu" },
          };
        })
      );

      // Activité récente (derniers logs) - filtrer les actions admin uniquement
      const recentActivity = await prisma.activityLog.findMany({
        where: {
          action: {
            in: [
              "ISSUE_WARNING",
              "REVOKE_WARNING",
              "ISSUE_SANCTION",
              "REVOKE_SANCTION",
              "DELETE_COMMENT",
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      res.json({
        statistics: {
          totalObservations,
          pendingObservations,
          validatedObservations,
          rejectedObservations,
          totalReplies,
          totalSpecies,
          activeWarnings,
          activeSanctions,
        },
        recentObservations: observationsWithAuthors,
        recentActivity,
      });
    } catch (error) {
      console.error("❌ Erreur getDashboard:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 👤 Statistiques détaillées d'un utilisateur
  async getUserStatistics(req, res) {
    try {
      const { userId } = req.params;
      const userIdInt = parseInt(userId);

      // Récupérer infos de base depuis auth-service
      const userInfo = await getUserInfo(userIdInt);
      if (!userInfo) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const [
        observationsCreated,
        observationsValidated,
        observationsRejected,
        repliesCreated,
        speciesCreated,
        votesGiven,
        warningsReceived,
        sanctionsReceived,
      ] = await Promise.all([
        prisma.observation.count({
          where: { authorId: userIdInt, deleted: false },
        }),
        prisma.observation.count({
          where: { authorId: userIdInt, status: "VALIDATED", deleted: false },
        }),
        prisma.observation.count({
          where: { authorId: userIdInt, status: "REJECTED", deleted: false },
        }),
        prisma.reply.count({ where: { authorId: userIdInt, deleted: false } }),
        prisma.species.count({
          where: { authorId: userIdInt, deleted: false },
        }),
        prisma.vote.count({ where: { userId: userIdInt } }),
        prisma.warning.findMany({
          where: { userId: userIdInt },
          orderBy: { createdAt: "desc" },
        }),
        prisma.userSanction.findMany({
          where: { userId: userIdInt },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      // Activité de l'utilisateur
      const userActivity = await prisma.activityLog.findMany({
        where: { userId: userIdInt },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Commentaires récents
      const recentComments = await prisma.reply.findMany({
        where: { authorId: userIdInt, deleted: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          observation: {
            select: {
              id: true,
              description: true,
              species: { select: { name: true } },
            },
          },
        },
      });

      res.json({
        user: userInfo,
        statistics: {
          observations: {
            created: observationsCreated,
            validated: observationsValidated,
            rejected: observationsRejected,
          },
          replies: repliesCreated,
          species: speciesCreated,
          votes: votesGiven,
        },
        moderation: {
          warnings: warningsReceived,
          sanctions: sanctionsReceived,
        },
        recentComments,
        activity: userActivity,
      });
    } catch (error) {
      console.error("❌ Erreur getUserStatistics:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ⚠️ Créer un avertissement
  async createWarning(req, res) {
    try {
      const { userId, reason, severity, expiresInDays } = req.body;
      const issuedBy = req.user.id;

      // Valider que l'utilisateur existe
      const userExists = await getUserInfo(parseInt(userId));
      if (!userExists) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const warning = await prisma.warning.create({
        data: {
          userId: parseInt(userId),
          issuedBy,
          reason,
          severity: severity || "MEDIUM",
          expiresAt,
        },
      });

      // Log l'action
      await prisma.activityLog.create({
        data: {
          userId: issuedBy,
          action: "ISSUE_WARNING",
          targetType: "User",
          targetId: parseInt(userId),
          metadata: { warningId: warning.id, severity, reason },
        },
      });

      // Notifier l'utilisateur
      const issuerInfo = await getUserInfo(issuedBy);
      await notificationService.createNotification(
        parseInt(userId),
        "WARNING_RECEIVED",
        `⚠️ Avertissement ${severity}`,
        `Vous avez reçu un avertissement de la part de ${issuerInfo?.username}.\n\nRaison: ${reason}`,
        null
      );

      res.status(201).json({
        success: true,
        warning,
      });
    } catch (error) {
      console.error("❌ Erreur createWarning:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 🚫 Créer une sanction
  async createSanction(req, res) {
    try {
      const { userId, type, reason, expiresInDays } = req.body;
      const issuedBy = req.user.id;

      // Valider que l'utilisateur existe
      const userExists = await getUserInfo(parseInt(userId));
      if (!userExists) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const sanction = await prisma.userSanction.create({
        data: {
          userId: parseInt(userId),
          type,
          reason,
          issuedBy,
          expiresAt,
        },
      });

      // Log l'action
      await prisma.activityLog.create({
        data: {
          userId: issuedBy,
          action: "ISSUE_SANCTION",
          targetType: "User",
          targetId: parseInt(userId),
          metadata: { sanctionId: sanction.id, type, reason },
        },
      });

      // Notifier l'utilisateur avec le bon type de notification
      const issuerInfo = await getUserInfo(issuedBy);

      let notifType, notifTitle, notifMessage;

      switch (type) {
        case "PERMANENT_BAN":
          notifType = "ACCOUNT_BANNED";
          notifTitle = "🔴 Compte banni";
          notifMessage = `Votre compte a été définitivement banni par ${issuerInfo?.username}.\n\nRaison: ${reason}`;
          break;

        case "TEMPORARY_SUSPENSION":
          notifType = "ACCOUNT_SUSPENDED";
          notifTitle = "⏸️ Compte suspendu";
          notifMessage = `Votre compte a été suspendu par ${
            issuerInfo?.username
          } jusqu'au ${expiresAt?.toLocaleDateString()}.\n\nRaison: ${reason}`;
          break;

        case "COMMENT_RESTRICTION":
          notifType = "WARNING_RECEIVED";
          notifTitle = "🚫 Restriction de commentaires";
          notifMessage = expiresAt
            ? `Vous ne pouvez plus commenter jusqu'au ${expiresAt.toLocaleDateString()}. Sanction émise par ${
                issuerInfo?.username
              }.\n\nRaison: ${reason}`
            : `Vous ne pouvez plus commenter. Sanction émise par ${issuerInfo?.username}.\n\nRaison: ${reason}`;
          break;

        case "CONTENT_RESTRICTION":
          notifType = "WARNING_RECEIVED";
          notifTitle = "🚫 Restriction de création de contenu";
          notifMessage = expiresAt
            ? `Vous ne pouvez plus créer d'espèces jusqu'au ${expiresAt.toLocaleDateString()}. Sanction émise par ${
                issuerInfo?.username
              }.\n\nRaison: ${reason}`
            : `Vous ne pouvez plus créer d'espèces. Sanction émise par ${issuerInfo?.username}.\n\nRaison: ${reason}`;
          break;

        default:
          notifType = "WARNING_RECEIVED";
          notifTitle = "⚠️ Sanction reçue";
          notifMessage = `Une sanction a été émise contre votre compte par ${issuerInfo?.username}.\n\nRaison: ${reason}`;
      }

      await notificationService.createNotification(
        parseInt(userId),
        notifType,
        notifTitle,
        notifMessage,
        null
      );

      res.status(201).json({
        success: true,
        sanction,
      });
    } catch (error) {
      console.error("❌ Erreur createSanction:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 🗑️ Supprimer un commentaire (modération)
  async deleteComment(req, res) {
    try {
      const { replyId } = req.params;
      const { reason } = req.body;
      const deletedBy = req.user.id;

      const reply = await prisma.reply.findUnique({
        where: { id: parseInt(replyId) },
        include: {
          observation: {
            select: {
              id: true,
              species: { select: { name: true } },
            },
          },
        },
      });

      if (!reply) {
        return res.status(404).json({ error: "Commentaire non trouvé" });
      }

      if (reply.deleted) {
        return res.status(400).json({ error: "Commentaire déjà supprimé" });
      }

      // Supprimer le commentaire
      const deletedReply = await prisma.reply.update({
        where: { id: parseInt(replyId) },
        data: {
          deleted: true,
          deletedBy,
          deletedAt: new Date(),
          deletionReason: reason || "Supprimé par un modérateur",
        },
      });

      // Log l'action
      await prisma.activityLog.create({
        data: {
          userId: deletedBy,
          action: "DELETE_COMMENT",
          targetType: "Reply",
          targetId: parseInt(replyId),
          metadata: {
            authorId: reply.authorId,
            observationId: reply.observationId,
            reason,
          },
        },
      });

      // Notifier l'auteur du commentaire
      const moderatorInfo = await getUserInfo(deletedBy);
      const authorInfo = await getUserInfo(reply.authorId);
      const observationTitle = reply.observation.description
        ? reply.observation.description.substring(0, 50) +
          (reply.observation.description.length > 50 ? "..." : "")
        : `Observation #${reply.observation.id}`;

      await notificationService.createNotification(
        reply.authorId,
        "COMMENT_DELETED",
        "🗑️ Modération Commentaires",
        `Votre commentaire sur l'observation "${
          reply.observation.species.name
        }" (${observationTitle}) a été supprimé par ${
          moderatorInfo?.username
        } (#${deletedBy}).\n\nRaison: ${reason || "Non spécifiée"}`,
        reply.observation.id
      );

      res.json({
        success: true,
        message: "Commentaire supprimé",
        reply: deletedReply,
      });
    } catch (error) {
      console.error("❌ Erreur deleteComment:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 📜 Récupérer tous les logs d'activité
  async getActivityLogs(req, res) {
    try {
      let { userId, action, page = 1, limit = 50 } = req.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (userId) where.userId = parseInt(userId);

      // Fix: action peut être un array si envoyé plusieurs fois
      if (action) {
        action = Array.isArray(action) ? action[0] : action;
        if (action !== "") {
          where.action = action;
        }
      }

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: parseInt(limit),
        }),
        prisma.activityLog.count({ where }),
      ]);

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 📋 Liste tous les avertissements
  async getWarnings(req, res) {
    try {
      const { userId, active } = req.query;
      const where = {};
      if (userId) where.userId = parseInt(userId);
      if (active !== undefined) where.active = active === "true";

      const warnings = await prisma.warning.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      // Enrichir avec les infos utilisateurs
      const warningsWithUsers = await Promise.all(
        warnings.map(async (warning) => {
          const userInfo = await getUserInfo(warning.userId);
          const issuerInfo = await getUserInfo(warning.issuedBy);
          return {
            ...warning,
            user: userInfo || { id: warning.userId, username: "Inconnu" },
            issuer: issuerInfo || { id: warning.issuedBy, username: "Admin" },
          };
        })
      );

      res.json({ warnings: warningsWithUsers });
    } catch (error) {
      console.error("❌ Erreur getWarnings:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 📋 Liste toutes les sanctions
  async getSanctions(req, res) {
    try {
      const { userId, active } = req.query;
      const where = {};
      if (userId) where.userId = parseInt(userId);
      if (active !== undefined) where.active = active === "true";

      const sanctions = await prisma.userSanction.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      // Enrichir avec les infos utilisateurs
      const sanctionsWithUsers = await Promise.all(
        sanctions.map(async (sanction) => {
          const userInfo = await getUserInfo(sanction.userId);
          const issuerInfo = await getUserInfo(sanction.issuedBy);
          return {
            ...sanction,
            user: userInfo || { id: sanction.userId, username: "Inconnu" },
            issuer: issuerInfo || { id: sanction.issuedBy, username: "Admin" },
          };
        })
      );

      res.json({ sanctions: sanctionsWithUsers });
    } catch (error) {
      console.error("❌ Erreur getSanctions:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ✅ Révoquer un avertissement
  async revokeWarning(req, res) {
    try {
      const { warningId } = req.params;
      const { reason } = req.body; // Raison optionnelle de la révocation

      const warning = await prisma.warning.update({
        where: { id: parseInt(warningId) },
        data: {
          active: false,
          revokedBy: req.user.id,
          revokedAt: new Date(),
          revokeReason: reason || "Révoqué par l'administrateur",
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: "REVOKE_WARNING",
          targetType: "Warning",
          targetId: parseInt(warningId),
          metadata: { reason },
        },
      });

      res.json({ success: true, warning });
    } catch (error) {
      console.error("❌ Erreur revokeWarning:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ✅ Révoquer une sanction
  async revokeSanction(req, res) {
    try {
      const { sanctionId } = req.params;
      const { reason } = req.body; // Raison optionnelle de la révocation

      const sanction = await prisma.userSanction.update({
        where: { id: parseInt(sanctionId) },
        data: {
          active: false,
          revokedBy: req.user.id,
          revokedAt: new Date(),
          revokeReason: reason || "Révoqué par l'administrateur",
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: "REVOKE_SANCTION",
          targetType: "UserSanction",
          targetId: parseInt(sanctionId),
          metadata: { reason },
        },
      });

      res.json({ success: true, sanction });
    } catch (error) {
      console.error("❌ Erreur revokeSanction:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 💬 Récupérer les commentaires récents
  async getRecentComments(req, res) {
    try {
      const { limit = 50 } = req.query;

      const comments = await prisma.reply.findMany({
        where: { deleted: false },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
        include: {
          observation: {
            select: {
              id: true,
              description: true,
              species: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Récupérer les infos utilisateurs pour chaque commentaire
      const commentsWithUsers = await Promise.all(
        comments.map(async (comment) => {
          const userInfo = await getUserInfo(comment.authorId);
          return {
            ...comment,
            user: userInfo || { id: comment.authorId, username: "Inconnu" },
          };
        })
      );

      res.json({ comments: commentsWithUsers });
    } catch (error) {
      console.error("❌ Erreur getRecentComments:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};

module.exports = adminController;
