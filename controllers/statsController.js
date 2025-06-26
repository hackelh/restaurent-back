const { Appointment, Patient, SuiviMedical } = require('../models/sequelize');
const { Op } = require('sequelize');

// @desc    Obtenir les statistiques du tableau de bord
// @route   GET /api/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    console.log('Début getStats - URL:', req.originalUrl);
    console.log('User:', req.user);
    if (!req.user || !req.user.id) {
      throw new Error('Utilisateur non authentifié ou ID manquant');
    }

    // Obtenir la date d'aujourd'hui (début et fin de journée)
    const debutJournee = new Date();
    debutJournee.setHours(0, 0, 0, 0);
    const finJournee = new Date();
    finJournee.setHours(23, 59, 59, 999);

    // Début du mois en cours
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    // Fin du mois en cours
    const finMois = new Date(debutMois);
    finMois.setMonth(finMois.getMonth() + 1);
    finMois.setDate(0);
    finMois.setHours(23, 59, 59, 999);

    const dentisteId = req.user.id;
    
    console.log('Dates calculées:', {
      debutJournee,
      finJournee,
      debutMois,
      finMois
    });

    console.log('Début des requêtes de statistiques pour dentisteId:', dentisteId);
    
    // Statistiques pour le tableau de bord
    const [totalPatients, todayAppointmentsCount, monthlyPrescriptions, todayAppointmentsDetails] = await Promise.all([
      // Nombre total de patients
      Patient.count({
        where: { dentisteId }
      }),
      // Nombre de rendez-vous aujourd'hui
      Appointment.count({
        where: {
          dentisteId,
          date: {
            [Op.between]: [debutJournee, finJournee]
          },
          status: {
            [Op.ne]: 'cancelled'
          }
        }
      }),
      // Nombre de prescriptions ce mois-ci
      SuiviMedical.count({
        include: [{
          model: Patient,
          as: 'patient',
          where: { dentisteId }
        }],
        where: {
          date: {
            [Op.between]: [debutMois, finMois]
          }
        }
      }),
      // Détails des rendez-vous d'aujourd'hui
      Appointment.findAll({
        where: {
          dentisteId,
          date: {
            [Op.between]: [debutJournee, finJournee]
          },
          status: {
            [Op.ne]: 'cancelled'
          }
        },
        include: [{
          model: Patient,
          as: 'patient',
          attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
        }],
        order: [['date', 'ASC']]
      })
    ]);

    console.log('Route actuelle:', req.originalUrl);
    // Si la route est /api/stats/dashboard, inclure les prochains rendez-vous
    if (req.originalUrl.endsWith('/dashboard')) {
      console.log('Récupération des prochains rendez-vous');
      const upcomingAppointments = await Appointment.findAll({
        where: {
          dentisteId,
          date: {
            [Op.gte]: new Date()
          },
          status: {
            [Op.notIn]: ['cancelled']
          }
        },
        include: [{
          model: Patient,
          as: 'patient',
          attributes: ['id', 'nom', 'prenom']
        }],
        order: [['date', 'ASC']],
        limit: 5
      });

      const stats = {
        todayAppointments: todayAppointmentsDetails.map(appointment => ({
          id: appointment.id,
          date: appointment.date,
          type: appointment.type,
          status: appointment.status,
          patient: appointment.patient ? {
            id: appointment.patient.id,
            nom: appointment.patient.nom,
            prenom: appointment.patient.prenom,
            telephone: appointment.patient.telephone,
            email: appointment.patient.email
          } : null
        })),
        todayAppointmentsCount,
        totalPatients,
        monthlyPrescriptions,
        upcomingAppointments
      };

      return res.status(200).json({
        success: true,
        data: stats
      });
    }

    // Traitement des données pour le dashboard
    const stats = {
      totalPatients,
      todayAppointmentsCount,
      monthlyPrescriptions,
      todayAppointments: todayAppointmentsDetails.map(appointment => ({
        id: appointment.id,
        date: appointment.date,
        type: appointment.type,
        status: appointment.status,
        patient: appointment.patient ? {
          id: appointment.patient.id,
          nom: appointment.patient.nom,
          prenom: appointment.patient.prenom,
          telephone: appointment.patient.telephone,
          email: appointment.patient.email
        } : null
      })),
      statsByStatus: todayAppointmentsDetails.reduce((acc, appointment) => {
        acc[appointment.status] = (acc[appointment.status] || 0) + 1;
        return acc;
      }, {}),
      statsByType: todayAppointmentsDetails.reduce((acc, appointment) => {
        acc[appointment.type] = (acc[appointment.type] || 0) + 1;
        return acc;
      }, {}),
      upcomingAppointments: upcomingAppointments.map(appointment => ({
        id: appointment.id,
        date: appointment.date,
        type: appointment.type,
        status: appointment.status,
        patient: appointment.patient ? {
          id: appointment.patient.id,
          nom: appointment.patient.nom,
          prenom: appointment.patient.prenom
        } : null
      }))
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur détaillée dans getStats:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    // Si c'est une erreur d'authentification, renvoyer 401
    if (error.message === 'Utilisateur non authentifié ou ID manquant') {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }
    next(error);
  }
};

// @desc    Obtenir les statistiques des rendez-vous par période
// @route   GET /api/stats/Appointment
// @access  Private
exports.getAppointmentStats = async (req, res, next) => {
  try {
    const { debut, fin } = req.query;
    const whereClause = {
      dentisteId: req.user.id
    };

    if (debut || fin) {
      whereClause.date = {};
      if (debut) whereClause.date[Op.gte] = new Date(debut);
      if (fin) whereClause.date[Op.lte] = new Date(fin);
    }

    const appointment = await appointment.findAll({
      where: whereClause,
      attributes: ['date', 'status'],
      order: [['date', 'ASC']]
    });

    const stats = {
      total: appointment.length,
      parStatut: {
        planifie: appointment.filter(rdv => rdv.status === 'planifié').length,
        confirme: appointment.filter(rdv => rdv.status === 'confirmé').length,
        annule: appointment.filter(rdv => rdv.status === 'annulé').length,
        termine: appointment.filter(rdv => rdv.status === 'terminé').length
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les statistiques financières
// @route   GET /api/stats/finances
// @access  Private
exports.getFinanceStats = async (req, res, next) => {
  try {
    const { debut, fin } = req.query;
    const whereClause = {
      dentisteId: req.user.id
    };

    if (debut || fin) {
      whereClause.date = {};
      if (debut) whereClause.date[Op.gte] = new Date(debut);
      if (fin) whereClause.date[Op.lte] = new Date(fin);
    }

    const suivis = await SuiviMedical.findAll({
      where: whereClause,
      attributes: ['cout']
    });

    const stats = {
      total: suivis.reduce((acc, suivi) => acc + suivi.cout.montant, 0),
      paye: suivis.reduce((acc, suivi) => acc + (suivi.cout.paye ? suivi.cout.montant : 0), 0),
      impaye: suivis.reduce((acc, suivi) => acc + (!suivi.cout.paye ? suivi.cout.montant : 0), 0),
      parMethode: {
        carte: suivis.filter(s => s.cout.methodePaiement === 'carte').length,
        especes: suivis.filter(s => s.cout.methodePaiement === 'espèces').length,
        cheque: suivis.filter(s => s.cout.methodePaiement === 'chèque').length,
        autre: suivis.filter(s => s.cout.methodePaiement === 'autre').length
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
