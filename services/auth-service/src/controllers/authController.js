const authService = require("../services/authService");

async function register(req, res) {
  try {
    const { email, username, password, role } = req.body;
    const result = await authService.register({
      email,
      username,
      password,
      role,
    });
    return res.status(201).json(result);
  } catch (err) {
    console.error("Register error:", err);
    const message = err.message || "Internal server error";
    if (message.includes("already in use") || message.includes("required")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    return res.json(result);
  } catch (err) {
    console.error("Login error:", err);
    const message = err.message || "Internal server error";
    if (
      message.includes("Invalid identifier") ||
      message.includes("required")
    ) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getme(req, res) {
  try {
    const userId = req.user.id;
    const user = await authService.getUserById(userId);
    return res.json(user);
  } catch (err) {
    console.error("Erreur récupération utilisateur:", err);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

async function refreshToken(req, res) {
  try {
    const userId = req.user.id;
    const result = await authService.refreshToken(userId);
    return res.json(result);
  } catch (err) {
    console.error("Erreur rafraîchissement token:", err);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

async function verifyPassword(req, res) {
  try {
    const { identifier, password } = req.body;
    const user = await authService.verifyCredentials(identifier, password);
    return res.json({ valid: true, user });
  } catch (err) {
    console.error("Verify password error:", err);
    const message = err.message || "Internal server error";
    if (
      message.includes("Invalid credentials") ||
      message.includes("required")
    ) {
      return res.status(400).json({ error: message, valid: false });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function verify2FA(req, res) {
  try {
    const { userId, code } = req.body;
    const result = await authService.verify2FA(userId, code);
    return res.json(result);
  } catch (err) {
    console.error("Verify 2FA error:", err);
    const message = err.message || "Internal server error";
    if (
      message.includes("Invalid code") ||
      message.includes("expired") ||
      message.includes("required")
    ) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return res.json(result);
  } catch (err) {
    console.error("Forgot password error:", err);
    const message = err.message || "Internal server error";
    if (message.includes("No account") || message.includes("required")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return res.json(result);
  } catch (err) {
    console.error("Reset password error:", err);
    const message = err.message || "Internal server error";
    if (message.includes("Token") || message.includes("required")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getUserPublicInfo(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const user = await authService.getUserById(userId);
    // Ne retourner que les infos publiques
    return res.json({
      id: user.id,
      username: user.username,
    });
  } catch (err) {
    console.error("Erreur récupération utilisateur:", err);
    if (err.message === "User not found") {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}

module.exports = {
  register,
  login,
  verify2FA,
  refreshToken,
  verifyPassword,
  getme,
  forgotPassword,
  resetPassword,
  getUserPublicInfo,
};
