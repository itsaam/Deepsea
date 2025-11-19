const authService = require('../services/authService');

async function register(req, res) {
    try {
        const {email, username, password, role} = req.body;
        const result = await authService.register({email, username, password, role});
        return res.status(201).json(result);
    } catch (err) {
        console.error('Register error:', err);
        const message = err.message || 'Internal server error';
        if (message.includes('already in use') || message.includes('required')) {
            return res.status(400).json({error: message});
        }
        return res.status(500).json({error: 'Internal server error'});
    }
}

async function login(req, res) {
    try {
        const {identifier, password} = req.body;
        const result = await authService.login(identifier, password);
        return res.json(result);
    } catch (err) {
        console.error('Login error:', err);
        const message = err.message || 'Internal server error';
        if (message.includes('Invalid identifier') || message.includes('required')) {
            return res.status(400).json({error: message});
        }
        return res.status(500).json({error: 'Internal server error'});
    }
}

async function getme(req, res) {
    try {
        const userId = req.user.id;
        const user = await authService.getUserById(userId);
        return res.json(user);
    } catch (err) {
        console.error('Get me error:', err);
        return res.status(500).json({error: 'Internal server error'});
    }
}

async function refreshToken(req, res) {
    try {
        const userId = req.user.id;
        const result = await authService.refreshToken(userId);
        return res.json(result);
    } catch (err) {
        console.error('Refresh token error:', err);
        return res.status(500).json({error: 'Internal server error'});
    }
}

async function verifyPassword(req, res) {
    try {
        const {identifier, password} = req.body;
        const user = await authService.verifyCredentials(identifier, password);
        return res.json({valid: true, user});
    } catch (err) {
        console.error('Verify password error:', err);
        const message = err.message || 'Internal server error';
        if (message.includes('Invalid credentials') || message.includes('required')) {
            return res.status(400).json({error: message, valid: false});
        }
        return res.status(500).json({error: 'Internal server error'});
    }
}

module.exports = {
    register, login, refreshToken, verifyPassword, getme
};

