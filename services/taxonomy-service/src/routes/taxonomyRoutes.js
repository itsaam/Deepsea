const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getStats } = require('../controllers/taxonomyController');

/**
 * @swagger
 * /taxonomy/stats:
 *   get:
 *     summary: Récupère les statistiques taxonomiques et classifications hiérarchiques
 *     description: Interroge observation-service pour analyser les espèces et observations, puis génère des statistiques complètes incluant occurrences, moyennes, mots-clés récurrents et classification hiérarchique
 *     tags: [Taxonomy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques taxonomiques générées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxonomyStats'
 *             example:
 *               summary:
 *                 totalSpecies: 15
 *                 totalObservations: 42
 *                 averageObservationsPerSpecies: 2.8
 *               occurrencesBySpecies:
 *                 "1": 8
 *                 "2": 5
 *                 "3": 12
 *               keywords:
 *                 - keyword: "bioluminescent"
 *                   count: 15
 *                 - keyword: "abyssal"
 *                   count: 12
 *               classification:
 *                 - family: "Leviathan"
 *                   speciesCount: 3
 *                   totalObservations: 25
 *                   branches:
 *                     - branch: "L"
 *                       species: []
 *                   species: []
 *       401:
 *         description: Token JWT manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur lors du calcul des statistiques
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', verifyToken, getStats);

module.exports = router;

