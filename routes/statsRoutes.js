const express = require('express');
const router = express.Router();
const {
  getStats,
  getAppointmentStats,
  getFinanceStats
} = require('../controllers/statsController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', getStats);
router.get('/dashboard', getStats);
router.get('/rendezvous', getAppointmentStats);
router.get('/finances', getFinanceStats);

module.exports = router;
