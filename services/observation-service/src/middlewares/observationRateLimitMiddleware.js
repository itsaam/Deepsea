const rateLimit = require("express-rate-limit");

// Rate limit spécifique pour la création d'observations : 100 par heure PAR UTILISATEUR
const observationCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 100, // 100 observations max par heure
  message: {
    error: "Limite de création d'observations atteinte",
    message:
      "Vous avez atteint la limite de 30 observations par heure. Veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Exemption pour les ADMIN
  skip: (req) => {
    return req.user && req.user.role === "ADMIN";
  },
});

module.exports = observationCreationLimiter;
