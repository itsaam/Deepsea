const prisma = require('../../prismaClient');
const { hashPassword, comparePassword } = require('../utils/hashUtils');

function sanitize(user) {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
}

async function createUser({ email, username, password, role }) {
    if (!email || !username || !password) {
        throw new Error('email, username and password are required');
    }
    const existingEmail = await prisma.user.findUnique({
        where: { email }
    });
    if (existingEmail) {
        throw new Error('Email already in use');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
            email,
            username,
            password: passwordHash,
            role: role === 'ADMIN' ? 'ADMIN' : role === 'EXPERT' ? 'EXPERT' : 'USER'
        },
        select: {
            id: true, email: true, username: true, role: true, reputation: true, createdAt: true
        }
    });

    return sanitize(user);
}

async function findByIdentifier(identifier) {
    return prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { username: identifier }] },
        select: {
            id: true, email: true, username: true, password: true, role: true, reputation: true, createdAt: true
        }
    });
}

async function getAllUsers() {
    return prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            reputation: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

async function deleteUser(userId) {
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
        throw new Error('Invalid user ID');
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        throw new Error('User not found');
    }
    await prisma.user.delete({ where: { id } });
    return true;
}

module.exports = {
    sanitize,
    createUser,
    findByIdentifier,
    getAllUsers,
    deleteUser
};
