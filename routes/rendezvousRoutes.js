const express = require('express');
const router = express.Router();
const {
  getRendezVous,
  getRendezVousById,
  createRendezVous,
  updateRendezVous,
  deleteRendezVous
} = require('../controllers/rendezVousController');
const { verifyToken } = require('../middlewares/auth');

// Appliquer le middleware d'authentification à toutes les routes
router.use(verifyToken);

// Routes principales
router
  .route('/')
  .get(getRendezVous)
  .post(createRendezVous);

router
  .route('/:id')
  .get(getRendezVousById)
  .put(updateRendezVous)
  .delete(deleteRendezVous);

module.exports = router;
