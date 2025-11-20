const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const speciesService = require("../services/speciesService");

/**
 * @swagger
 * /species:
 *   get:
 *     summary: Récupérer toutes les espèces
 *     tags: [Species]
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rarity, createdAt]
 *         description: Trier par rareté ou date de création
 *     responses:
 *       200:
 *         description: Liste des espèces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Species'
 */
router.get("/", async (req, res) => {
  try {
    const sortBy = req.query.sortBy; // ?sortBy=rarity
    const species = await speciesService.getAllSpecies(sortBy);
    res.status(200).json(species);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /species:
 *   post:
 *     summary: Créer une nouvelle espèce
 *     tags: [Species]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Espèce créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Species'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const newSpecies = await speciesService.createSpecies(
      req.body,
      req.user.id
    );
    res.status(201).json(newSpecies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /species/{id}:
 *   get:
 *     summary: Récupérer une espèce par ID
 *     tags: [Species]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de l'espèce
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Species'
 *       404:
 *         description: Espèce non trouvée
 */
router.get("/:id", async (req, res) => {
  try {
    const species = await speciesService.getSpeciesById(req.params.id);
    if (!species) {
      return res.status(404).json({ error: "Espèce non trouvée" });
    }
    res.status(200).json(species);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
