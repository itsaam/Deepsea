const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

/**
 * Routes internes pour communication entre microservices
 * Ces routes ne nécessitent pas d'authentification JWT
 * car elles sont appelées directement par d'autres services
 */

/**
 * @swagger
 * /internal/promote-expert:
 *   post:
 *     summary: Promouvoir un utilisateur en EXPERT (route interne - service-to-service)
 *     tags: [Internal]
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
 */
router.post("/promote-expert", adminController.promoteToExpert);

module.exports = router;
