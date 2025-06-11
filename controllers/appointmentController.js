const { Appointment, Patient } = require('../models/sequelize');
const { Op } = require('sequelize');

// Debug logs
console.log('Models loaded:', { Appointment, Patient });

exports.createAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create({
      ...req.body,
      dentisteId: req.user.id
    });
    res.status(201).json(appointment);
  } catch (error) {
    console.error("Erreur createAppointment:", error);
    res.status(400).json({ error: 'Erreur lors de la création du rendez-vous' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    console.log('Récupération des rendez-vous pour le dentiste:', req.user.id);

    const appointments = await Appointment.findAll({
      where: { 
        dentisteId: req.user.id 
      },
      where: { dentisteId: req.user.id },
      include: [{ 
        model: Patient,
        as: 'patient',
        attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'dateNaissance'],
        where: { dentisteId: req.user.id }
      }],
      order: [['date', 'DESC']]
    });
    res.json(appointments);
  } catch (error) {
    console.error("Erreur getAppointments:", error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous' });
  }
};

exports.getAppointment = async (req, res) => {
  try {
    console.log('Getting appointment:', req.params.id);
    const appointment = await Appointment.findOne({
      where: {
        id: req.params.id,
        dentisteId: req.user.id
      },
      include: [{ model: Patient, as: 'patient' }]
    });
    if (!appointment) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    res.json(appointment);
  } catch (error) {
    console.error("Erreur getAppointment:", error);
    res.status(500).json({ error: 'Erreur lors de la récupération du rendez-vous' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Rendez-vous non trouvé' });

    await appointment.update(req.body);
    res.json(appointment);
  } catch (error) {
    console.error("Erreur updateAppointment:", error);
    res.status(400).json({ error: 'Erreur lors de la mise à jour du rendez-vous' });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Rendez-vous non trouvé' });

    await appointment.destroy();
    res.json({ message: 'Rendez-vous supprimé' });
  } catch (error) {
    console.error("Erreur deleteAppointment:", error);
    res.status(500).json({ error: 'Erreur lors de la suppression du rendez-vous' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Rendez-vous non trouvé' });

    appointment.status = req.body.status;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error("Erreur updateAppointmentStatus:", error);
    res.status(400).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
};

exports.getUpcomingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: {
        dentisteId: req.user.id,
        date: {
          [Op.gte]: new Date()
        }
      },
      include: [{ model: Patient, as: 'patient' }],
      order: [['date', 'ASC']],
      limit: 5
    });
    res.json(appointments);
  } catch (error) {
    console.error("Erreur getUpcomingAppointments:", error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous à venir' });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Vérifier que le patient existe et appartient au dentiste connecté
    const patient = await Patient.findOne({
      where: {
        id: patientId,
        dentisteId: req.user.id
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé ou accès non autorisé'
      });
    }

    // Récupérer les rendez-vous du patient pour le dentiste connecté
    const appointments = await Appointment.findAll({
      where: { 
        patientId,
        dentisteId: req.user.id
      },
      order: [['date', 'DESC']],
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'nom', 'prenom'],
          where: { dentisteId: req.user.id },
          required: true
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Erreur getPatientAppointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous du patient',
      error: error.message
    });
  }
};
