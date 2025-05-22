const { RendezVous, Patient, User } = require('../models/sequelize');
const { Op } = require('sequelize');
const moment = require('moment');

// Log pour le débogage
console.log('Modèles chargés:', { RendezVous, Patient, User });

// Créer un nouveau rendez-vous
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, date, type, notes } = req.body;
    const dentisteId = req.user.id;

    // Vérifier si le patient existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Convertir la date en objet moment
    const appointmentDate = moment(date);
    const startTime = appointmentDate.clone().subtract(25, 'minutes');
    const endTime = appointmentDate.clone().add(25, 'minutes');

    // Vérifier si un rendez-vous existe déjà dans cet intervalle
    const existingAppointment = await RendezVous.findOne({
      where: {
        dentisteId,
        date: {
          [Op.between]: [startTime.toDate(), endTime.toDate()]
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: 'Un rendez-vous existe déjà dans cet intervalle de temps'
      });
    }

    // Créer le rendez-vous
    const appointment = await RendezVous.create({
      date: appointmentDate.toDate(),
      type,
      notes,
      patientId,
      dentisteId,
      status: 'pending',
      duree: 25 // Durée fixée à 25 minutes
    });

    // Retourner le rendez-vous créé avec les informations du patient
    const newAppointment = await RendezVous.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Rendez-vous créé avec succès',
      data: newAppointment
    });
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    res.status(500).json({ message: 'Erreur lors de la création du rendez-vous' });
  }
};

// Obtenir tous les rendez-vous
exports.getAppointments = async (req, res) => {
  try {
    const dentisteId = req.user.id;
    const { date, upcoming } = req.query;

    let whereClause = { dentisteId };

    // Filtre par date
    if (date) {
      const startOfDay = moment(date).startOf('day').toDate();
      const endOfDay = moment(date).endOf('day').toDate();
      whereClause.date = {
        [Op.between]: [startOfDay, endOfDay]
      };
    }

    // Filtre pour les rendez-vous à venir
    if (upcoming === 'true') {
      whereClause.date = {
        [Op.gte]: new Date()
      };
    }

    const appointments = await RendezVous.findAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
        }
      ],
      order: [['date', 'ASC']]
    });

    res.json({
      message: 'Rendez-vous récupérés avec succès',
      data: appointments
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous' });
  }
};

// Obtenir un rendez-vous par ID
exports.getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id, {
      include: [
        {
          model: Patient,
          attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    res.json({
      message: 'Rendez-vous récupéré avec succès',
      data: appointment
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du rendez-vous:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du rendez-vous' });
  }
};

// Mettre à jour un rendez-vous
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, notes, status } = req.body;

    const appointment = await RendezVous.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    // Mettre à jour le rendez-vous
    await appointment.update({
      date,
      type,
      notes,
      status
    });

    const updatedAppointment = await RendezVous.findByPk(id, {
      include: [
        {
          model: Patient,
          attributes: ['id', 'nom', 'prenom', 'telephone']
        }
      ]
    });

    res.json({
      message: 'Rendez-vous mis à jour avec succès',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rendez-vous:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du rendez-vous' });
  }
};

// Supprimer un rendez-vous
exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await RendezVous.findByPk(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé' });
    }

    await appointment.destroy();
    res.json({ message: 'Rendez-vous supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du rendez-vous:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du rendez-vous' });
  }
};

// Obtenir les prochains rendez-vous
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const dentisteId = req.user.id;
    const now = new Date();

    const appointments = await RendezVous.findAll({
      where: {
        dentisteId,
        dateTime: {
          [Op.gte]: now
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
      include: [{
        model: Patient,
        attributes: ['id', 'nom', 'prenom']
      }],
      order: [['dateTime', 'ASC']],
      limit: 5
    });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des prochains rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des prochains rendez-vous'
    });
  }
};

// Mettre à jour le statut d'un rendez-vous
exports.updateAppointmentStatus = async (req, res) => {
  try {
    console.log('=== Début de updateAppointmentStatus ===');
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`Tentative de mise à jour du rendez-vous ${id} avec le statut:`, status);

    // Vérifier si le statut est valide
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'missed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Statut invalide. Les statuts valides sont : ' + validStatuses.join(', ')
      });
    }

    console.log('Recherche du rendez-vous avec ID:', id);
    // Trouver le rendez-vous
    const appointment = await RendezVous.findByPk(id);
    if (!appointment) {
      console.error('ERREUR: Rendez-vous non trouvé avec ID:', id);
      return res.status(404).json({ 
        success: false,
        message: 'Rendez-vous non trouvé',
        id: id
      });
    }

    console.log('Rendez-vous trouvé:', appointment);
    // Mettre à jour le statut
    await appointment.update({ status });

    // Récupérer le rendez-vous mis à jour avec les informations du patient
    const updatedAppointment = await RendezVous.findByPk(id, {
      include: [{
        model: Patient,
        attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
      }]
    });

    console.log('Rendez-vous mis à jour avec succès:', updatedAppointment);
    res.json({
      success: true,
      message: 'Statut du rendez-vous mis à jour avec succès',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du statut du rendez-vous'
    });
  }
};
