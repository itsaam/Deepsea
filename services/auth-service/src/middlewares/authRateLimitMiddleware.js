const rateLimit = require("express-rate-limit");

// Rate limit pour login : 50 tentatives par 15 minutes PAR IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 tentatives max
  message: {
    error: "Trop de tentatives de connexion",
    message:
      "Vous avez effectué trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne compte que les échecs
  keyGenerator: (req) => req.ip, // Par IP
});

// Rate limit pour register : 20 inscriptions par heure
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 inscriptions max par heure
  message: {
    error: "Trop de tentatives d'inscription",
    message:
      "Vous avez effectué trop de tentatives d'inscription. Veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter,
};
