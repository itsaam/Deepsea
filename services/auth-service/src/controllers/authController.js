const authService = require("../services/authService");
const {
  gererErreurController,
} = require("../../../../shared/utils/gestionErreurs");

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
  } catch (erreur) {
    return gererErreurController(erreur, res, "inscription");
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    return res.json(result);
  } catch (erreur) {
    return gererErreurController(erreur, res, "connexion");
  }
}

async function getme(req, res) {
  try {
    const userId = req.user.id;
    const user = await authService.getUserById(userId);
    return res.json(user);
  } catch (erreur) {
    return gererErreurController(erreur, res, "récupération profil");
  }
}

async function refreshToken(req, res) {
  try {
    const userId = req.user.id;
    const result = await authService.refreshToken(userId);
    return res.json(result);
  } catch (erreur) {
    return gererErreurController(erreur, res, "rafraîchissement token");
  }
}

async function verifyPassword(req, res) {
  try {
    const { identifier, password } = req.body;
    const user = await authService.verifyCredentials(identifier, password);
    return res.json({ valid: true, user });
  } catch (erreur) {
    return gererErreurController(erreur, res, "vérification mot de passe");
  }
}

async function verify2FA(req, res) {
  try {
    const { userId, code } = req.body;
    const result = await authService.verify2FA(userId, code);
    return res.json(result);
  } catch (erreur) {
    return gererErreurController(erreur, res, "vérification 2FA");
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return res.json(result);
  } catch (erreur) {
    return gererErreurController(erreur, res, "mot de passe oublié");
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return res.json(result);
  } catch (erreur) {
    return gererErreurController(erreur, res, "réinitialisation mot de passe");
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
  } catch (erreur) {
    if (erreur.message === "User not found") {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    return gererErreurController(erreur, res, "récupération infos utilisateur");
  }
}

async function getAllUsersPublic(req, res) {
  try {
    const users = await authService.getAllUsersPublic();
    return res.json(users);
  } catch (erreur) {
    return gererErreurController(erreur, res, "récupération utilisateurs");
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
  getAllUsersPublic,
};
