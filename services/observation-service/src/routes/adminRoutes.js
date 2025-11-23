const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

// Middleware pour vérifier que l'utilisateur est ADMIN
const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Accès refusé. Admin requis." });
  }
  next();
};

// Toutes les routes nécessitent JWT + ADMIN
router.use(authMiddleware);
router.use(isAdmin);

// 📊 Dashboard
router.get("/dashboard", adminController.getDashboard);

// 👤 Statistiques utilisateur
router.get("/users/:userId/statistics", adminController.getUserStatistics);

// ⚠️ Gestion des avertissements
router.post("/warnings", adminController.createWarning);
router.get("/warnings", adminController.getWarnings);
router.patch("/warnings/:warningId/revoke", adminController.revokeWarning);

// 🚫 Gestion des sanctions
router.post("/sanctions", adminController.createSanction);
router.get("/sanctions", adminController.getSanctions);
router.patch("/sanctions/:sanctionId/revoke", adminController.revokeSanction);

// 🗑️ Modération des commentaires
router.get("/comments/recent", adminController.getRecentComments);
router.delete("/comments/:replyId", adminController.deleteComment);

// 📏 Logs d'activité
router.get("/activity-logs", adminController.getActivityLogs);

module.exports = router;
