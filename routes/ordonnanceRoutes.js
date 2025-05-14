const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
  getOrdonnances,
  getOrdonnanceById,
  createOrdonnance,
  updateOrdonnance,
  deleteOrdonnance
} = require('../controllers/ordonnanceController');

// Appliquer le middleware d'authentification à toutes les routes
router.use(verifyToken);

// Routes principales
router
  .route('/')
  .get(getOrdonnances)
  .post(createOrdonnance);

router
  .route('/:id')
  .get(getOrdonnanceById)
  .put(updateOrdonnance)
  .delete(deleteOrdonnance);

module.exports = router;
