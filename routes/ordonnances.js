const express = require('express');
const router = express.Router();
const ordonnanceController = require('../controllers/ordonnanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Routes pour les ordonnances
router.get('/', ordonnanceController.getOrdonnances);
router.get('/:id', ordonnanceController.getOrdonnanceById);
router.post('/', ordonnanceController.createOrdonnance);
router.put('/:id', ordonnanceController.updateOrdonnance);
router.delete('/:id', ordonnanceController.deleteOrdonnance);
router.patch('/:id/status', ordonnanceController.updateOrdonnanceStatus);
router.get('/:id/pdf', ordonnanceController.generatePDF);

module.exports = router;
