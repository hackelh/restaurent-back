const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getSuivis,
  getSuivi,
  createSuivi,
  updateSuivi,
  deleteSuivi,
  ajouterDocument
} = require('../controllers/suiviController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router
  .route('/')
  .get(getSuivis)
  .post(createSuivi);

router
  .route('/:id')
  .get(getSuivi)
  .put(updateSuivi)
  .delete(deleteSuivi);

router.post('/:id/documents', ajouterDocument);

module.exports = router;
