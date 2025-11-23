const jwt = require("jsonwebtoken");
const messageService = require("../services/messageService");

function initializeSocketIO(server) {
  const io = require("socket.io")(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Middleware d'authentification WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`✅ User ${socket.username} connected to messaging`);

    // Rejoindre une room personnelle (pour recevoir les messages)
    socket.join(`user:${socket.userId}`);

    // Envoyer un message
    socket.on("send_message", async (data) => {
      try {
        const {
          recipientId,
          encryptedContent,
          conversationId,
          replyToId,
          isBot,
        } = data;

        // Sauvegarder le message en DB
        const message = await messageService.sendMessage(
          socket.userId,
          recipientId,
          encryptedContent,
          conversationId,
          replyToId
        );

        // Envoyer au destinataire en temps réel
        io.to(`user:${recipientId}`).emit("new_message", {
          ...message,
          senderUsername: socket.username,
        });

        // Confirmer à l'expéditeur
        socket.emit("message_sent", { messageId: message.id });

        console.log(`📨 Message envoyé: ${socket.userId} → ${recipientId}`);

        // Si le destinataire est le bot, générer une réponse automatique
        const botService = require("../services/botService");
        if (isBot || recipientId === botService.getBotUserId()) {
          console.log(
            "🤖 Message pour le bot détecté, génération de la réponse..."
          );

          // Le message est en clair (pas chiffré) pour le bot
          const userMessage = encryptedContent;

          // Générer la réponse du bot
          const botResponse = await botService.generateBotResponse(userMessage);

          // Envoyer la réponse du bot en clair (pas de chiffrement)
          const botMessage = await messageService.sendMessage(
            recipientId, // Le bot envoie
            socket.userId, // À l'utilisateur
            botResponse, // Texte en clair
            conversationId
          );

          // Envoyer la réponse au client
          io.to(`user:${socket.userId}`).emit("new_message", {
            ...botMessage,
            senderUsername: "DeepSeaBot",
          });

          console.log("🤖 Réponse du bot envoyée");
        }
      } catch (error) {
        console.error("Échec de l'envoi du message:", error.message);
        socket.emit("error", { message: "Échec de l'envoi du message" });
      }
    });

    // Marquer comme lu
    socket.on("mark_read", async (data) => {
      try {
        const { conversationId } = data;
        await messageService.markConversationAsRead(
          conversationId,
          socket.userId
        );

        socket.emit("marked_read", { conversationId });
      } catch (error) {
        console.error("Failed to mark as read:", error.message);
      }
    });

    // Modifier un message
    socket.on("edit_message", async (data) => {
      try {
        const { messageId, encryptedContent } = data;

        // Mettre à jour en DB
        const updated = await messageService.editMessage(
          messageId,
          socket.userId,
          encryptedContent
        );

        // Notifier tous les participants
        const recipientId =
          updated.recipientId === socket.userId
            ? updated.senderId
            : updated.recipientId;

        io.to(`user:${recipientId}`).emit("message_edited", {
          messageId,
          encryptedContent,
          isEdited: true,
        });

        socket.emit("message_edited", {
          messageId,
          encryptedContent,
          isEdited: true,
        });

        console.log(`✏️ Message modifié: ${messageId} par ${socket.userId}`);
      } catch (error) {
        console.error("Échec de la modification du message:", error.message);
        socket.emit("error", {
          message: "Échec de la modification du message",
        });
      }
    });

    // Supprimer un message
    socket.on("delete_message", async (data) => {
      try {
        const { messageId } = data;

        // Supprimer en DB (soft delete)
        const deleted = await messageService.deleteMessage(
          messageId,
          socket.userId
        );

        // Notifier tous les participants
        const recipientId =
          deleted.recipientId === socket.userId
            ? deleted.senderId
            : deleted.recipientId;

        io.to(`user:${recipientId}`).emit("message_deleted", { messageId });
        socket.emit("message_deleted", { messageId });

        console.log(`🗑️ Message supprimé: ${messageId} par ${socket.userId}`);
      } catch (error) {
        console.error("Échec de la suppression du message:", error.message);
        socket.emit("error", { message: "Échec de la suppression du message" });
      }
    });

    // Utilisateur commence à taper
    socket.on("typing", (data) => {
      const { recipientId } = data;
      io.to(`user:${recipientId}`).emit("user_typing", {
        userId: socket.userId,
        username: socket.username,
      });
    });

    // Déconnexion
    socket.on("disconnect", () => {
      console.log(`👋 User ${socket.username} disconnected from messaging`);
    });
  });

  return io;
}

module.exports = { initializeSocketIO };
