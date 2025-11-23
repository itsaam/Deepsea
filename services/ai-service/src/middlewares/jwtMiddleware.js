const jwt = require("jsonwebtoken");

/**
 * Middleware JWT pour protéger les routes AI Service
 */
const jwtMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Token manquant",
        message: "Authentification requise",
      });
    }

    // Vérifier le format "Bearer TOKEN"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        error: "Format token invalide",
        message: "Le format doit être: Bearer <token>",
      });
    }

    const token = parts[1];

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajouter les infos user à la requête
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expiré",
        message: "Votre session a expiré, veuillez vous reconnecter",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token invalide",
        message: "Le token fourni n'est pas valide",
      });
    }

    console.error("🔐 Erreur JWT Middleware:", error);
    return res.status(500).json({
      error: "Erreur serveur",
      message: "Erreur lors de la vérification du token",
    });
  }
};

module.exports = jwtMiddleware;
