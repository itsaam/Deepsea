const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Vous n'avez pas les permissions nécessaires" });
    }

    next();
  };
};

module.exports = requireRole;
