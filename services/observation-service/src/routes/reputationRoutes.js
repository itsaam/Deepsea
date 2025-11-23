const express = require("express");
const router = express.Router();
const axios = require("axios");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

// GET /reputation/:userId - Récupérer la réputation d'un utilisateur
router.get("/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Récupérer la réputation depuis l'auth-service
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/internal/user/${userId}`
    );
    const userInfo = response.data;

    if (!userInfo) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({
      userId: userInfo.id,
      username: userInfo.username,
      reputation: userInfo.reputation || 0,
      role: userInfo.role,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la réputation:",
      error.message
    );

    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
