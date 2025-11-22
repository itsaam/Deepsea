const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes par défaut
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200, // 200 requêtes par fenêtre
  message: {
    error: "Trop de requêtes",
    message:
      "Vous avez dépassé la limite de requêtes. Veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Pas de limite pour les utilisateurs authentifiés (seulement pour anonymes)
  skip: (req) => {
    // Skip si utilisateur authentifié (a un token)
    const hasAuth = req.headers.authorization;
    return !!hasAuth;
  },
});

module.exports = limiter;
