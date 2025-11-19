const {signToken, verifyToken} = require("../config/jwt");
const prisma = require("../../prismaClient");

async function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({error: "Missing Authorization header"});
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
        return res.status(401).json({error: "Invalid Authorization format"});
    }

    try {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: {id: decoded.sub},
            select: {id: true, email: true, username: true, role: true, createdAt: true}
        });
        if (!user) {
            return res.status(401).json({error: "User not found"});
        }
        req.user = user;
        next();
    } catch (err) {
        console.error("JWT error:", err);
        return res.status(401).json({error: "Invalid or expired token"});
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({error: "User not authenticated"});
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({error: "Forbidden: insufficient role"});
        }
        next();
    };
}

module.exports = {
    signToken,
    authMiddleware,
    requireRole
};