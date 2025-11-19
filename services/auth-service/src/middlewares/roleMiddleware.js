const roleMiddleware = (requiredRoles) => {
  const needed = []
    .concat(requiredRoles || [])
    .filter(Boolean)
    .map((r) => String(r).toLowerCase());

  const requireRoles = needed.length > 0;

  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let userRoles = [];
    if (Array.isArray(user.roles)) {
      userRoles = user.roles.map((r) => String(r).toLowerCase());
    } else if (user.role) {
      userRoles = [String(user.role).toLowerCase()];
    }
    if (!requireRoles) {
      return next();
    }

    const allowed = userRoles.some((r) => needed.includes(r));
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
};

module.exports = roleMiddleware;