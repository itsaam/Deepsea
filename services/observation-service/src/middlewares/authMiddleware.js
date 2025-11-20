const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Format de token invalide" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded.sub || decoded.userId;

    req.user = {
      id: userId,
      role: decoded.role,
      email: decoded.email,
      username: decoded.username
    };

    next();
  } catch (error) {
      return res.status(401).json({ error: "Token invalide ou expiré" });
  }
};

module.exports = authMiddleware;
