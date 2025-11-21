const jwt = require("jsonwebtoken");

const jwtMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token manquant",
        message: "Veuillez fournir un token d'authentification",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expiré",
        message: "Votre session a expiré, veuillez vous reconnecter",
      });
    }

    return res.status(401).json({
      error: "Token invalide",
      message: "Le token fourni n'est pas valide",
    });
  }
};

module.exports = jwtMiddleware;
