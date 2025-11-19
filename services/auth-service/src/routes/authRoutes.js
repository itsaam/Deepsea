const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getme);
router.post('/refresh', authMiddleware, authController.refreshToken);
router.post('/verify', authController.verifyPassword);

module.exports = router;
