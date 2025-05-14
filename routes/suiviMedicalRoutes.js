const express = require('express');
const router = express.Router();
const suiviMedicalController = require('../controllers/suiviMedicalController');
const { verifyToken } = require('../middlewares/auth');
const { 
    validateSuiviMedical, 
    validateMongoId, 
    validatePagination 
} = require('../middlewares/validators');
const { upload, handleUploadError } = require('../middlewares/uploadMiddleware');

// Récupérer tout le suivi médical d'un patient
router.get('/suivi/:patientId', [
    verifyToken,
    validateMongoId,
    validatePagination
], suiviMedicalController.getSuiviMedicalByPatient);

// Créer un nouveau suivi médical avec upload d'ordonnance
router.post('/suivi', [
    verifyToken,
    upload,
    handleUploadError,
    validateSuiviMedical
], suiviMedicalController.createSuiviMedical);

// Télécharger une ordonnance
router.get('/suivi/:suiviId/ordonnance', [
    verifyToken,
    validateMongoId
], suiviMedicalController.getOrdonnance);

// Supprimer une ordonnance
router.delete('/suivi/:suiviId/ordonnance', [
    verifyToken,
    validateMongoId
], suiviMedicalController.deleteOrdonnance);

module.exports = router;
