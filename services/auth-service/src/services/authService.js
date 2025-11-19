const prisma = require('../../prismaClient');
const {hashPassword, comparePassword} = require('../utils/hashUtils');
const {signToken} = require('../config/jwt');

async function register({email, username, password, role}) {
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
            id: true,
            email: true,
            username: true,
            role: true,
            reputation: true,
            createdAt: true
        }
    });

    const token = signToken(user);

    return {user, token};
}

async function login(identifier, password) {
    if (!identifier || !password) {
        throw new Error('identifier and password are required');
    }

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                {email: identifier},
                {username: identifier}
            ]
        },
        select: {
            id: true,
            email: true,
            username: true,
            password: true,
            role: true,
            reputation: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new Error('Invalid identifier or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid identifier or password');
    }

    const {password: _, ...userWithoutPassword} = user;

    const token = signToken(userWithoutPassword);

    return {user: userWithoutPassword, token};
}

async function verifyCredentials(identifier, password) {
    if (!identifier || !password) {
        throw new Error('identifier and password are required');
    }

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                {email: identifier},
                {username: identifier}
            ]
        },
        select: {
            id: true,
            email: true,
            username: true,
            password: true,
            role: true,
            reputation: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    const {password: _, ...userWithoutPassword} = user;
    return userWithoutPassword;
}

async function refreshToken(userId) {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            reputation: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const token = signToken(user);
    return {user, token};
}

module.exports = {
    register,
    login,
    verifyCredentials,
    refreshToken
};
