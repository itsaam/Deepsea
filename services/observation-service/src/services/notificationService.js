const prisma = require("../config/database");

/**
 * Crée une notification pour un utilisateur
 */
const createNotification = async (
  userId,
  type,
  title,
  message,
  relatedId = null
) => {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      relatedId: relatedId ? parseInt(relatedId, 10) : null,
    },
  });
};

/**
 * Récupère toutes les notifications d'un utilisateur
 */
const getUserNotifications = async (userId, unreadOnly = false) => {
  const where = { userId };
  if (unreadOnly) {
    where.read = false;
  }

  return await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Marque une notification comme lue
 */
const markAsRead = async (notificationId, userId) => {
  // Vérifier que la notification appartient bien à l'utilisateur
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error("Notification non trouvée");
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  });
};

/**
 * Compte les notifications non lues
 */
const getUnreadCount = async (userId) => {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
};

/**
 * Supprime une notification
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error("Notification non trouvée");
  }

  return await prisma.notification.delete({
    where: { id: notificationId },
  });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};
