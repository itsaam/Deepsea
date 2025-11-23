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

/**
 * @swagger
 * /internal/user/{id}:
 *   get:
 *     summary: Récupérer les infos publiques d'un utilisateur (route interne)
 *     tags: [Internal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Infos utilisateur
 */
router.get("/user/:id", async (req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        username: true,
        role: true,
        reputation: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur récupération user:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
