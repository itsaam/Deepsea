const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const replyController = require("../controllers/replyController");
const {
  checkCommentRestriction,
} = require("../middlewares/restrictionMiddleware");
const { checkActiveWarnings } = require("../middlewares/warningMiddleware");

/**
 * @swagger
 * /observations/{observationId}/replies:
 *   post:
 *     summary: Ajouter un commentaire à une observation
 *     tags: [Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: observationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'observation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Contenu du commentaire
 *     responses:
 *       201:
 *         description: Commentaire créé avec succès
 *       400:
 *         description: Contenu invalide
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Observation non trouvée
 */
router.post(
  "/observations/:observationId/replies",
  authMiddleware,
  checkActiveWarnings,
  checkCommentRestriction,
  replyController.createReply
);

/**
 * @swagger
 * /observations/{observationId}/replies:
 *   get:
 *     summary: Récupérer tous les commentaires d'une observation
 *     tags: [Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: observationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste des commentaires
 *       404:
 *         description: Observation non trouvée
 */
router.get(
  "/observations/:observationId/replies",
  authMiddleware,
  replyController.getRepliesByObservation
);

/**
 * @swagger
 * /replies/{replyId}:
 *   put:
 *     summary: Modifier son propre commentaire
 *     tags: [Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Commentaire modifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Commentaire non trouvé
 */
router.put("/replies/:replyId", authMiddleware, replyController.updateReply);

/**
 * @swagger
 * /replies/{replyId}:
 *   delete:
 *     summary: Supprimer son commentaire (ou admin)
 *     tags: [Replies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Commentaire supprimé
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Commentaire non trouvé
 */
router.delete("/replies/:replyId", authMiddleware, replyController.deleteReply);

module.exports = router;
