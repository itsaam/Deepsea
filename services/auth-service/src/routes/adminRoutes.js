const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Récupérer tous les utilisateurs (ADMIN seulement)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Accès refusé
 */
router.get("/users", adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{userId}:
 *   delete:
 *     summary: Supprimer un utilisateur (ADMIN seulement)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete("/users/:userId", adminController.deleteUser);

/**
 * @swagger
 * /admin/users/{userId}/role:
 *   patch:
 *     summary: Modifier le rôle d'un utilisateur (ADMIN seulement)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, EXPERT, ADMIN]
 *     responses:
 *       200:
 *         description: Rôle modifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.patch("/users/:userId/role", adminController.updateUserRole);

/**
 * @swagger
 * /admin/promote-expert:
 *   post:
 *     summary: Promouvoir un utilisateur en EXPERT (route interne)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Utilisateur promu en EXPERT
 *       403:
 *         description: Accès refusé
 */
router.post("/promote-expert", adminController.promoteToExpert);

/**
 * @swagger
 * /admin/casino/roulette:
 *   post:
 *     summary: Jouer à la roulette (ADMIN seulement) 🎰
 *     tags: [Admin Casino]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bets
 *             properties:
 *               bets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [straight, red, black, even, odd, low, high, dozen1, dozen2, dozen3]
 *                     amount:
 *                       type: number
 *                     value:
 *                       type: number
 *                       description: Requis seulement pour les paris "straight"
 *     responses:
 *       200:
 *         description: Résultat de la roulette
 *       403:
 *         description: Accès refusé
 */
router.post("/casino/roulette", adminController.playRoulette);

module.exports = router;
