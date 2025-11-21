const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
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

/**
 * @swagger
 * /species/{id}/soft-delete:
 *   patch:
 *     summary: Supprimer une espèce (soft delete)
 *     tags: [Species]
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
 *         description: Espèce supprimée (soft delete)
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Espèce non trouvée
 */
router.patch(
  "/:id/soft-delete",
  authMiddleware,
  requireRole("EXPERT", "ADMIN"),
  async (req, res) => {
    try {
      const deletedSpecies = await speciesService.softDeleteSpecies(
        parseInt(req.params.id),
        req.user.id
      );
      res.status(200).json({
        message: "Espèce supprimée (soft delete)",
        species: deletedSpecies,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /species/{id}/restore:
 *   patch:
 *     summary: Restaurer une espèce supprimée
 *     tags: [Species]
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
 *         description: Espèce restaurée
 *       403:
 *         description: Accès refusé (ADMIN uniquement)
 *       404:
 *         description: Espèce non trouvée
 */
router.patch(
  "/:id/restore",
  authMiddleware,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const restoredSpecies = await speciesService.restoreSpecies(
        parseInt(req.params.id)
      );
      res.status(200).json({
        message: "Espèce restaurée",
        species: restoredSpecies,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
