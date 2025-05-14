const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées
router.get('/me', authMiddleware.verifyToken, authController.getMe);
router.post('/logout', authMiddleware.verifyToken, authController.logout);

module.exports = router;
