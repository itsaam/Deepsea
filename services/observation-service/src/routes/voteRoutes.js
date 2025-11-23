const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const voteController = require("../controllers/voteController");

/**
 * @swagger
 * /observations/{observationId}/vote:
 *   post:
 *     summary: Voter pour une observation (upvote/downvote)
 *     tags: [Votes]
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
 *               - value
 *             properties:
 *               value:
 *                 type: integer
 *                 enum: [1, -1]
 *                 description: 1 pour upvote, -1 pour downvote
 *     responses:
 *       200:
 *         description: Vote enregistré
 *       400:
 *         description: Valeur de vote invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Impossible de voter pour sa propre observation
 *       404:
 *         description: Observation non trouvée
 */
router.post(
  "/observations/:observationId/vote",
  authMiddleware,
  voteController.voteObservation
);

/**
 * @swagger
 * /observations/{observationId}/vote:
 *   delete:
 *     summary: Retirer son vote
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: observationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vote retiré
 *       404:
 *         description: Vote non trouvé
 */
router.delete(
  "/observations/:observationId/vote",
  authMiddleware,
  voteController.removeVote
);

/**
 * @swagger
 * /observations/{observationId}/vote/stats:
 *   get:
 *     summary: Obtenir les statistiques de vote d'une observation
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: observationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistiques de vote
 *       404:
 *         description: Observation non trouvée
 */
router.get(
  "/observations/:observationId/vote/stats",
  authMiddleware,
  voteController.getVoteStats
);

/**
 * @swagger
 * /observations/top:
 *   get:
 *     summary: Obtenir les observations les mieux votées
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top observations
 */
router.get(
  "/observations/top",
  authMiddleware,
  voteController.getTopObservations
);

module.exports = router;
