const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");
const { checkActiveWarnings } = require("../middlewares/warningMiddleware");

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);
// Vérifier les warnings actifs (bloque si ban CRITICAL)
router.use(checkActiveWarnings);

// GET /api/notifications - Récupérer mes notifications
router.get("/", notificationController.getMyNotifications);

// GET /api/notifications/unread-count - Nombre de notifs non lues
router.get("/unread-count", notificationController.getUnreadCount);

// PUT /api/notifications/:id/read - Marquer comme lue
router.put("/:id/read", notificationController.markAsRead);

// PUT /api/notifications/read-all - Marquer toutes comme lues
router.put("/read-all", notificationController.markAllAsRead);

// DELETE /api/notifications/:id - Supprimer une notification
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
