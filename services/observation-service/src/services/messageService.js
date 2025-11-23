const prisma = require("../../prismaClient");
const axios = require("axios");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

class MessageService {
  /**
   * Créer ou récupérer une conversation entre 2 users
   */
  async getOrCreateConversation(user1Id, user2Id) {
    // Toujours trier les IDs pour éviter les doublons
    const [smallerId, largerId] =
      user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    let conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: smallerId,
          user2Id: largerId,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 50,
          where: {
            OR: [
              { senderId: user1Id, deletedBySender: false },
              { recipientId: user1Id, deletedByRecipient: false },
            ],
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: smallerId,
          user2Id: largerId,
        },
        include: {
          messages: true,
        },
      });
    }

    return conversation;
  }

  /**
   * Récupérer toutes les conversations d'un user
   */
  async getUserConversations(userId) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Dernier message uniquement
          where: {
            OR: [
              { senderId: userId, deletedBySender: false },
              { recipientId: userId, deletedByRecipient: false },
            ],
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    // Compter les messages non lus
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            recipientId: userId,
            isRead: false,
            deletedByRecipient: false,
          },
        });

        return {
          ...conv,
          unreadCount,
          otherUserId: conv.user1Id === userId ? conv.user2Id : conv.user1Id,
        };
      })
    );

    return conversationsWithUnread;
  }

  /**
   * Envoyer un message (déjà chiffré côté client)
   */
  async sendMessage(
    senderId,
    recipientId,
    encryptedContent,
    conversationId,
    replyToId = null
  ) {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        recipientId,
        encryptedContent,
        replyToId,
      },
    });

    // Mettre à jour lastMessageAt de la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  /**
   * Marquer un message comme lu
   */
  async markAsRead(messageId, userId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.recipientId !== userId) {
      throw new Error("Message non trouvé ou accès refusé");
    }

    return prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  /**
   * Marquer tous les messages d'une conversation comme lus
   */
  async markConversationAsRead(conversationId, userId) {
    return prisma.message.updateMany({
      where: {
        conversationId,
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * Supprimer un message (soft delete côté user)
   */
  async deleteMessage(messageId, userId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message non trouvé");
    }

    // Soft delete selon qui supprime
    const updateData = {};
    if (message.senderId === userId) {
      updateData.deletedBySender = true;
    }
    if (message.recipientId === userId) {
      updateData.deletedByRecipient = true;
    }

    return prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });
  }

  /**
   * Sauvegarder/Récupérer les clés publiques
   */
  async saveUserKeys(userId, publicKey, encryptedPrivateKey) {
    return prisma.userKeys.upsert({
      where: { userId },
      create: {
        userId,
        publicKey,
        encryptedPrivateKey,
      },
      update: {
        publicKey,
        encryptedPrivateKey,
      },
    });
  }

  async getUserPublicKey(userId) {
    const keys = await prisma.userKeys.findUnique({
      where: { userId },
      select: { publicKey: true },
    });
    return keys?.publicKey;
  }

  async getUserKeys(userId) {
    return prisma.userKeys.findUnique({
      where: { userId },
    });
  }

  /**
   * Récupérer tous les utilisateurs (sauf l'utilisateur courant)
   * Pour pouvoir démarrer une conversation
   * Appelle l'auth-service car les users sont gérés là-bas
   */
  async getAllUsers(currentUserId) {
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/auth/users`);
      const users = response.data;

      console.log("📋 All users from auth-service:", users);
      console.log("👤 Current user ID:", currentUserId, typeof currentUserId);

      // Filtrer l'utilisateur courant
      const filtered = users
        .filter((u) => {
          console.log(
            `Comparing: u.id=${
              u.id
            } (${typeof u.id}) !== currentUserId=${currentUserId} (${typeof currentUserId}) = ${
              u.id !== currentUserId
            }`
          );
          return u.id !== currentUserId;
        })
        .map((u) => ({
          id: u.id,
          username: u.username,
          // Pas d'email pour la vie privée
        }));

      console.log("✅ Filtered users:", filtered);
      return filtered;
    } catch (error) {
      console.error("Failed to fetch users from auth-service:", error.message);
      return [];
    }
  }

  /**
   * Modifier un message
   */
  async editMessage(messageId, userId, newEncryptedContent) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message introuvable");
    }

    if (message.senderId !== userId) {
      throw new Error("Non autorisé à modifier ce message");
    }

    return await prisma.message.update({
      where: { id: messageId },
      data: {
        encryptedContent: newEncryptedContent,
        isEdited: true,
        editedAt: new Date(),
      },
    });
  }

  /**
   * Supprimer un message (soft delete)
   */
  async deleteMessage(messageId, userId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message introuvable");
    }

    if (message.senderId !== userId) {
      throw new Error("Non autorisé à supprimer ce message");
    }

    // Suppression douce : marquer comme supprimé par l'expéditeur
    return await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedBySender: true,
      },
    });
  }
}

module.exports = new MessageService();
