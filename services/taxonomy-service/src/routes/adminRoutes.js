const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const adminCtrl = require('../controllers/adminController');

/**
 * @swagger
 * /admin/user/{id}/history:
 *   get:
 *     summary: Récupère l'historique complet des actions d'un utilisateur
 *     description: Liste toutes les actions (DELETE, RESTORE, VALIDATE, REJECT) effectuées par un utilisateur spécifique
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserHistory'
 *       400:
 *         description: ID utilisateur invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle ADMIN requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/user/:id/history', verifyToken, requireRole('ADMIN'), adminCtrl.getUserHistory);

/**
 * @swagger
 * /expert/species/{id}/history:
 *   get:
 *     summary: Récupère l'historique des actions effectuées sur une espèce
 *     description: Liste toutes les actions (validations, rejets, suppressions) concernant une espèce donnée
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'espèce
 *     responses:
 *       200:
 *         description: Historique récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpeciesHistory'
 *       400:
 *         description: ID espèce invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle EXPERT ou ADMIN requis)
 *       500:
 *         description: Erreur serveur
 */
router.get('/species/:id/history', verifyToken, requireRole('EXPERT', 'ADMIN'), adminCtrl.getSpeciesHistory);

/**
 * @swagger
 * /admin/observations/{id}/soft-delete:
 *   patch:
 *     summary: Suppression logique d'une observation
 *     description: Marque une observation comme supprimée sans l'effacer physiquement de la base de données. L'action est historisée dans la table Audit.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'observation à supprimer
 *     responses:
 *       200:
 *         description: Observation supprimée logiquement avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: ID observation invalide ou observation déjà supprimée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle EXPERT ou ADMIN requis)
 *       500:
 *         description: Erreur lors de la suppression
 */
router.patch('/observations/:id/soft-delete', verifyToken, requireRole('EXPERT', 'ADMIN'), adminCtrl.softDeleteObservation);

/**
 * @swagger
 * /admin/observations/{id}/restore:
 *   patch:
 *     summary: Restaure une observation supprimée logiquement
 *     description: Retire le marqueur de suppression d'une observation. Cette action est réservée aux administrateurs et est historisée.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'observation à restaurer
 *     responses:
 *       200:
 *         description: Observation restaurée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: ID observation invalide ou observation non supprimée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (rôle ADMIN uniquement)
 *       500:
 *         description: Erreur lors de la restauration
 */
router.patch('/observations/:id/restore', verifyToken, requireRole('ADMIN'), adminCtrl.restoreObservation);

module.exports = router;

