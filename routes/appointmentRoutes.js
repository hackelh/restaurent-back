const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/auth');

// Authentification pour toutes les routes
router.use(authMiddleware.verifyToken);

// Middleware de debug global
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// Routes pour les rendez-vous
router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/upcoming', appointmentController.getUpcomingAppointments);
router.get('/:id', appointmentController.getAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);
router.put('/:id/status', appointmentController.updateAppointmentStatus);
router.get('/patient/:patientId', appointmentController.getPatientAppointments);

module.exports = router;
