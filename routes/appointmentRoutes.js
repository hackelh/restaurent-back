const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/auth');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware.verifyToken);

// Routes pour les rendez-vous
router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/upcoming', appointmentController.getUpcomingAppointments);

// Middleware de débogage pour toutes les routes
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// Routes avec paramètres d'URL
router.put('/:id/status', (req, res, next) => {
  console.log('Appel à /:id/status avec id:', req.params.id);
  appointmentController.updateAppointmentStatus(req, res, next);
});

router.get('/:id', (req, res, next) => {
  console.log('Appel à /:id avec id:', req.params.id);
  appointmentController.getAppointment(req, res, next);
});

router.put('/:id', (req, res, next) => {
  console.log('Appel à /:id (PUT) avec id:', req.params.id);
  appointmentController.updateAppointment(req, res, next);
});

router.delete('/:id', (req, res, next) => {
  console.log('Appel à /:id (DELETE) avec id:', req.params.id);
  appointmentController.deleteAppointment(req, res, next);
});

module.exports = router;
