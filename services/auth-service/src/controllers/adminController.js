const userService = require("../services/userService");
const {
  playRoulette: playRouletteGame,
  getFunMessage,
} = require("../utils/roulette");

async function getAllUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    return res.json({ users });
  } catch (err) {
    console.error("Erreur récupération utilisateurs:", err);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    await userService.deleteUser(userId);
    return res.status(204).send();
  } catch (err) {
    console.error("Erreur suppression utilisateur:", err);
    if (err.message === "Utilisateur introuvable") {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Le rôle est requis" });
    }

    const updatedUser = await userService.updateUserRole(userId, role);
    return res.json({ user: updatedUser });
  } catch (err) {
    console.error("Erreur modification rôle:", err);
    if (err.message === "Utilisateur introuvable") {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes("Invalid") || err.message.includes("Invalide")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

async function promoteToExpert(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId est requis" });
    }

    const updatedUser = await userService.updateUserRole(userId, "EXPERT");
    return res.json({
      success: true,
      message: "Utilisateur promu EXPERT",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Erreur promotion expert:", err);
    if (err.message === "Utilisateur introuvable") {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

async function playRoulette(req, res) {
  try {
    const { bets } = req.body;

    if (!bets || !Array.isArray(bets) || bets.length === 0) {
      return res.status(400).json({ error: "Au moins un pari est requis" });
    }

    // Validation des paris
    for (const bet of bets) {
      if (!bet.type || typeof bet.amount !== "number" || bet.amount <= 0) {
        return res.status(400).json({ error: "Format de pari invalide" });
      }
      if (bet.type === "straight" && (bet.value < 0 || bet.value > 36)) {
        return res
          .status(400)
          .json({ error: "Numéro de pari invalide (0-36)" });
      }
    }

    // Jouer à la roulette
    const result = playRouletteGame(bets);
    const funMessage = getFunMessage(result.netProfit);

    return res.json({
      ...result,
      funMessage,
      emoji: result.netProfit > 0 ? "🎉" : result.netProfit < 0 ? "😢" : "😐",
    });
  } catch (err) {
    console.error("Erreur roulette:", err);
    return res.status(500).json({ error: "Erreur lors du jeu" });
  }
}

module.exports = {
  getAllUsers,
  deleteUser,
  updateUserRole,
  promoteToExpert,
  playRoulette,
};
