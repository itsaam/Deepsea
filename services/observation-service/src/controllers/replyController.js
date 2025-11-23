const { PrismaClient } = require("@prisma/client");
const { validateReplyContent } = require("../utils/contentValidation");
const notificationService = require("../services/notificationService");
const axios = require("axios");
const prisma = new PrismaClient();

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

const replyController = {
  // 💬 Créer un reply sur une observation
  async createReply(req, res) {
    try {
      const { observationId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Validation anti-spam
      const validation = validateReplyContent(content);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      // Vérifier que l'observation existe et récupérer l'espèce
      const observation = await prisma.observation.findUnique({
        where: { id: parseInt(observationId) },
        include: {
          species: true,
        },
      });

      if (!observation) {
        return res.status(404).json({ error: "Observation non trouvée" });
      }

      if (observation.deleted) {
        return res.status(410).json({ error: "Observation supprimée" });
      }

      // Créer le reply
      const reply = await prisma.reply.create({
        data: {
          observationId: parseInt(observationId),
          authorId: userId,
          content: content.trim(),
        },
      });

      // 🔔 Créer une notification pour l'auteur de l'observation (sauf s'il commente sa propre observation)
      if (observation.authorId !== userId) {
        try {
          const commenterInfo = await getUserInfo(userId);
          const commenterUsername =
            commenterInfo?.username || `Utilisateur #${userId}`;

          const contentPreview =
            content.length > 100 ? content.substring(0, 97) + "..." : content;

          const observationTitle = observation.description
            ? observation.description.substring(0, 50) +
              (observation.description.length > 50 ? "..." : "")
            : `Observation #${observationId}`;

          const notificationMessage = `${commenterUsername} (#${userId}) a commenté votre observation de "${observation.species.name}":\n"${observationTitle}"\n\n${contentPreview}`;

          await notificationService.createNotification(
            observation.authorId,
            "NEW_COMMENT",
            "💬 Nouveau commentaire",
            notificationMessage,
            observationId
          );
        } catch (notifError) {
          // On continue même si la notification échoue
        }
      }

      res.status(201).json({
        success: true,
        message: "Commentaire ajouté avec succès",
        reply: {
          id: reply.id,
          content: reply.content,
          authorId: reply.authorId,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de la création du reply:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 📋 Récupérer tous les replies d'une observation
  async getRepliesByObservation(req, res) {
    try {
      const { observationId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Vérifier que l'observation existe
      const observation = await prisma.observation.findUnique({
        where: { id: parseInt(observationId) },
      });

      if (!observation) {
        return res.status(404).json({ error: "Observation non trouvée" });
      }

      // Récupérer les replies avec pagination
      const [replies, total] = await Promise.all([
        prisma.reply.findMany({
          where: {
            observationId: parseInt(observationId),
            deleted: false,
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.reply.count({
          where: {
            observationId: parseInt(observationId),
            deleted: false,
          },
        }),
      ]);

      // Enrichir avec les usernames
      const enrichedReplies = await Promise.all(
        replies.map(async (reply) => {
          const userInfo = await getUserInfo(reply.authorId);
          return {
            ...reply,
            authorUsername: userInfo?.username || `User #${reply.authorId}`,
            authorRole: userInfo?.role || "USER",
          };
        })
      );

      res.json({
        success: true,
        replies: enrichedReplies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des replies:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ✏️ Modifier son propre reply
  async updateReply(req, res) {
    try {
      const { replyId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Validation anti-spam
      const validation = validateReplyContent(content);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      // Vérifier que le reply existe et appartient à l'utilisateur
      const reply = await prisma.reply.findUnique({
        where: { id: parseInt(replyId) },
      });

      if (!reply) {
        return res.status(404).json({ error: "Commentaire non trouvé" });
      }

      if (reply.deleted) {
        return res.status(410).json({ error: "Commentaire supprimé" });
      }

      if (reply.authorId !== userId) {
        return res.status(403).json({
          error: "Vous ne pouvez modifier que vos propres commentaires",
        });
      }

      // Mettre à jour le reply
      const updatedReply = await prisma.reply.update({
        where: { id: parseInt(replyId) },
        data: {
          content: content.trim(),
        },
      });

      res.json({
        success: true,
        message: "Commentaire modifié avec succès",
        reply: updatedReply,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la modification du reply:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 🗑️ Supprimer son propre reply (soft delete)
  async deleteReply(req, res) {
    try {
      const { replyId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Vérifier que le reply existe
      const reply = await prisma.reply.findUnique({
        where: { id: parseInt(replyId) },
      });

      if (!reply) {
        return res.status(404).json({ error: "Commentaire non trouvé" });
      }

      if (reply.deleted) {
        return res.status(410).json({ error: "Commentaire déjà supprimé" });
      }

      // Seul l'auteur ou un admin peut supprimer
      if (reply.authorId !== userId && userRole !== "ADMIN") {
        return res.status(403).json({
          error: "Vous ne pouvez supprimer que vos propres commentaires",
        });
      }

      // Soft delete
      await prisma.reply.update({
        where: { id: parseInt(replyId) },
        data: {
          deleted: true,
          deletedBy: userId,
          deletedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: "Commentaire supprimé avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du reply:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};

module.exports = replyController;
