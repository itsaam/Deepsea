const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const observationService = require("../services/observationService");

/**
 * @swagger
 * /observations:
 *   post:
 *     summary: Créer une nouvelle observation
 *     tags: [Observations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - speciesId
 *               - description
 *             properties:
 *               speciesId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Observation créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Observation'
 *       400:
 *         description: Données invalides ou délai de 5min non respecté
 *       401:
 *         description: Non authentifié
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const newObservation = await observationService.createObservation(
      req.body,
      req.user.id
    );
    res.status(201).json(newObservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /observations/species/{id}/observations:
 *   get:
 *     summary: Récupérer les observations d'une espèce
 *     tags: [Observations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des observations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Observation'
 */
router.get("/species/:id/observations", async (req, res) => {
  try {
    const observations = await observationService.getObservationsBySpecies(
      req.params.id
    );
    res.status(200).json(observations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /observations/{id}/validate:
 *   post:
 *     summary: Valider une observation
 *     tags: [Observations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Observation validée (réputation +3, +1 si expert)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Observation'
 *       400:
 *         description: Impossible de valider (propre observation, déjà traitée)
 *       401:
 *         description: Non authentifié
 */
router.post("/:id/validate", authMiddleware, async (req, res) => {
  try {
    const validatedObservation = await observationService.validateObservation(
      req.params.id,
      req.user.id
    );
    res.status(200).json(validatedObservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /observations/{id}/reject:
 *   post:
 *     summary: Rejeter une observation
 *     tags: [Observations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Observation rejetée (réputation -1)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Observation'
 *       400:
 *         description: Impossible de rejeter (propre observation, déjà traitée)
 *       401:
 *         description: Non authentifié
 */
router.post("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const rejectedObservation = await observationService.rejectObservation(
      req.params.id,
      req.user.id
    );
    res.status(200).json(rejectedObservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
