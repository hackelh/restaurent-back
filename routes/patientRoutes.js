const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  ajouterOrdonnance,
  ajouterPathologie,
  ajouterOrdonnanceJSON
} = require('../controllers/patientController');
const { verifyToken } = require('../middlewares/auth');

// Appliquer le middleware d'authentification à toutes les routes
router.use(verifyToken);

// Routes principales des patients
router
  .route('/')
  .get(getPatients)
  .post(createPatient);

router
  .route('/:id')
  .get(getPatient)
  .put(updatePatient)
  .delete(deletePatient);

// Routes pour les ordonnances et pathologies
router
  .route('/:id/ordonnances')
  .post(ajouterOrdonnanceJSON);

router
  .route('/:id/pathologies')
  .post(ajouterPathologie);

module.exports = router;
