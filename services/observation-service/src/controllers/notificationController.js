const notificationService = require("../services/notificationService");

const notificationController = {
  // Récupérer toutes les notifications de l'utilisateur connecté
  getMyNotifications(req, res) {
    (async () => {
      try {
        const unreadOnly = req.query.unreadOnly === "true";
        const notifications = await notificationService.getUserNotifications(
          req.user.id,
          unreadOnly
        );
        res.status(200).json(notifications);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la récupération des notifications",
          details: error.message,
        });
      }
    })();
  },

  // Nombre de notifications non lues
  getUnreadCount(req, res) {
    (async () => {
      try {
        const count = await notificationService.getUnreadCount(req.user.id);
        res.status(200).json({ count });
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors du comptage des notifications",
          details: error.message,
        });
      }
    })();
  },

  // Marquer une notification comme lue
  markAsRead(req, res) {
    (async () => {
      try {
        const notificationId = parseInt(req.params.id, 10);
        const notification = await notificationService.markAsRead(
          notificationId,
          req.user.id
        );
        res.status(200).json(notification);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la mise à jour de la notification",
          details: error.message,
        });
      }
    })();
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead(req, res) {
    (async () => {
      try {
        await notificationService.markAllAsRead(req.user.id);
        res
          .status(200)
          .json({
            message: "Toutes les notifications ont été marquées comme lues",
          });
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la mise à jour des notifications",
          details: error.message,
        });
      }
    })();
  },

  // Supprimer une notification
  deleteNotification(req, res) {
    (async () => {
      try {
        const notificationId = parseInt(req.params.id, 10);
        await notificationService.deleteNotification(
          notificationId,
          req.user.id
        );
        res.status(200).json({ message: "Notification supprimée" });
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la suppression de la notification",
          details: error.message,
        });
      }
    })();
  },
};

module.exports = notificationController;
