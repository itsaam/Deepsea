const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const messageService = require("../services/messageService");

/**
 * GET /messages/conversations
 * Récupérer toutes les conversations de l'utilisateur
 */
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const conversations = await messageService.getUserConversations(
      req.user.id
    );
    res.json(conversations);
  } catch (error) {
    console.error("Failed to get conversations:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /messages/conversation/:otherUserId
 * Récupérer ou créer une conversation avec un user
 */
router.get("/conversation/:otherUserId", authMiddleware, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.otherUserId);

    if (otherUserId === req.user.id) {
      return res
        .status(400)
        .json({ error: "Impossible de discuter avec soi-même" });
    }

    const conversation = await messageService.getOrCreateConversation(
      req.user.id,
      otherUserId
    );

    res.json(conversation);
  } catch (error) {
    console.error("Failed to get conversation:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * POST /messages/keys
 * Sauvegarder les clés de chiffrement de l'utilisateur
 */
router.post("/keys", authMiddleware, async (req, res) => {
  try {
    const { publicKey, encryptedPrivateKey } = req.body;

    if (!publicKey || !encryptedPrivateKey) {
      return res.status(400).json({ error: "Clés manquantes" });
    }

    await messageService.saveUserKeys(
      req.user.id,
      publicKey,
      encryptedPrivateKey
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to save keys:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /messages/keys
 * Récupérer ses propres clés (pour déchiffrer)
 */
router.get("/keys", authMiddleware, async (req, res) => {
  try {
    const keys = await messageService.getUserKeys(req.user.id);

    if (!keys) {
      return res.status(404).json({ error: "Clés non trouvées" });
    }

    res.json(keys);
  } catch (error) {
    console.error("Failed to get keys:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /messages/public-key/:userId
 * Récupérer la clé publique d'un autre user (pour chiffrer)
 */
router.get("/public-key/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const publicKey = await messageService.getUserPublicKey(userId);

    if (!publicKey) {
      return res.status(404).json({ error: "Clé publique non trouvée" });
    }

    res.json({ publicKey });
  } catch (error) {
    console.error("Failed to get public key:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * GET /messages/users
 * Récupérer la liste de tous les utilisateurs (pour démarrer une conversation)
 */
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await messageService.getAllUsers(req.user.id);
    res.json(users);
  } catch (error) {
    console.error("Failed to get users:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * DELETE /messages/:messageId
 * Supprimer un message (soft delete)
 */
router.delete("/:messageId", authMiddleware, async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    await messageService.deleteMessage(messageId, req.user.id);

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete message:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
