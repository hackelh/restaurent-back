const express = require('express');
const router = express.Router();
const ordonnanceController = require('../controllers/ordonnanceController');
const { verifyToken } = require('../middlewares/auth');

// Appliquer le middleware d'authentification à toutes les routes
router.use(verifyToken);

// Routes principales
router.get('/', ordonnanceController.getOrdonnances);
router.post('/', ordonnanceController.createOrdonnance);

// Routes avec ID
router.get('/:id', ordonnanceController.getOrdonnanceById);
router.put('/:id', ordonnanceController.updateOrdonnance);
router.delete('/:id', ordonnanceController.deleteOrdonnance);

// Routes spéciales
router.get('/:id/pdf', ordonnanceController.generatePDF);
router.patch('/:id/status', ordonnanceController.updateOrdonnanceStatus);

module.exports = router;
