const { RendezVous, Patient } = require('../models/sequelize');
const { Op } = require('sequelize');

// @desc    Obtenir tous les rendez-vous avec filtres
// @route   GET /api/appointments
// @access  Private
exports.getRendezVous = async (req, res, next) => {
  try {
    console.log('Début getRendezVous - User:', req.user?.id);

    const {
      date,
      statut,
      typeSoin,
      patient: patientId,
      periode
    } = req.query;

    // Vérifier si l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const whereClause = { dentisteId: req.user.id };
    console.log('WhereClause initial:', whereClause);

    // Filtres
    if (date) {
      whereClause.date = new Date(date);
    } else if (periode) {
      const today = new Date();
      switch (periode) {
        case 'aujourd\'hui':
          whereClause.date = {
            [Op.gte]: new Date(today.setHours(0, 0, 0)),
            [Op.lt]: new Date(today.setHours(23, 59, 59))
          };
          break;
        case 'semaine':
          const debutSemaine = new Date(today);
          debutSemaine.setDate(today.getDate() - today.getDay());
          const finSemaine = new Date(debutSemaine);
          finSemaine.setDate(debutSemaine.getDate() + 6);
          whereClause.date = {
            [Op.gte]: debutSemaine,
            [Op.lt]: finSemaine
          };
          break;
        case 'mois':
          const debutMois = new Date(today.getFullYear(), today.getMonth(), 1);
          const finMois = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          whereClause.date = {
            [Op.gte]: debutMois,
            [Op.lt]: finMois
          };
          break;
      }
    }

    if (statut) {
      whereClause.status = statut; // Correction: 'status' au lieu de 'statut'
    }

    if (typeSoin) {
      whereClause.type = typeSoin; // Correction: 'type' au lieu de 'typeSoin'
    }

    if (patientId) {
      whereClause.patientId = patientId;
    }

    console.log('Exécution de la requête avec whereClause:', whereClause);
    
    const rendezVous = await RendezVous.findAll({
      where: whereClause,
      include: [{
        model: Patient,
        attributes: ['nom', 'prenom'],
        required: true
      }],
      order: [['date', 'ASC']]
    });

    console.log('Nombre de rendez-vous trouvés:', rendezVous.length);

    // Formater les données pour le frontend
    const formattedRendezVous = rendezVous.map(rdv => {
      const formatted = {
        _id: rdv.id,
        date: rdv.date,
        type: rdv.type,
        status: rdv.status,
        notes: rdv.notes,
        duree: rdv.duree
      };

      // Vérifier si Patient existe avant d'accéder à ses propriétés
      if (rdv.Patient) {
        formatted.patientName = `${rdv.Patient.nom} ${rdv.Patient.prenom}`;
      } else {
        formatted.patientName = 'Patient inconnu';
        console.warn('Patient manquant pour le rendez-vous:', rdv.id);
      }

      return formatted;
    });

    console.log('Envoi de la réponse avec', formattedRendezVous.length, 'rendez-vous');
    
    res.status(200).json({
      success: true,
      count: formattedRendezVous.length,
      data: formattedRendezVous
    });
  } catch (error) {
    console.error('Erreur dans getRendezVous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message
    });
  }
};

// @desc    Obtenir un rendez-vous
// @route   GET /api/rendezvous/:id
// @access  Private
exports.getRendezVousById = async (req, res, next) => {
  try {
    const rendezVous = await RendezVous.findOne({
      where: {
        id: req.params.id,
        dentisteId: req.user.id
      },
      include: [{
        model: Patient,
        attributes: ['nom', 'prenom', 'telephone', 'email', 'numeroSecu']
      }]
    });

    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: rendezVous
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un rendez-vous
// @route   POST /api/rendezvous
// @access  Private
// @desc    Créer un rendez-vous
// @route   POST /api/appointments
// @access  Private
exports.createRendezVous = async (req, res, next) => {
  try {
    req.body.dentisteId = req.user.id;

    // Vérifier si le patient existe
    const patient = await Patient.findByPk(req.body.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérifier si la date n'est pas dans le passé
    const dateRdv = new Date(req.body.date);
    const [heures, minutes] = req.body.heure.split(':');
    dateRdv.setHours(parseInt(heures), parseInt(minutes));

    if (dateRdv < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La date du rendez-vous ne peut pas être dans le passé'
      });
    }

    // Vérifier les horaires d'ouverture (8h-19h par exemple)
    const heure = parseInt(heures);
    if (heure < 8 || heure >= 19) {
      return res.status(400).json({
        success: false,
        message: 'Les rendez-vous doivent être pris entre 8h et 19h'
      });
    }

    const rendezVous = await RendezVous.create(req.body);

    // Recharger le rendez-vous avec les informations du patient
    const rdvWithPatient = await RendezVous.findByPk(rendezVous.id, {
      include: [{
        model: Patient,
        attributes: ['nom', 'prenom', 'telephone', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      data: {
        _id: rendezVous.id,
        date: rendezVous.date,
        type: rendezVous.type,
        status: rendezVous.status,
        patientName: `${rendezVous.Patient.nom} ${rendezVous.Patient.prenom}`,
        notes: rendezVous.notes,
        duree: rendezVous.duree
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }
    next(error);
  }
};

// @desc    Mettre à jour un rendez-vous
// @route   PUT /api/rendezvous/:id
// @access  Private
// @desc    Mettre à jour un rendez-vous
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateRendezVous = async (req, res, next) => {
  try {
    let rendezVous = await RendezVous.findOne({
      _id: req.params.id,
      dentiste: req.user.id
    });

    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Vérifier si le rendez-vous est déjà passé
    const maintenant = new Date();
    const dateRdv = new Date(rendezVous.date);
    const [heures, minutes] = rendezVous.heure.split(':');
    dateRdv.setHours(parseInt(heures), parseInt(minutes));

    if (dateRdv < maintenant && req.body.statut !== 'termine') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de modifier un rendez-vous passé'
      });
    }

    // Vérifier les transitions de statut valides
    if (req.body.statut) {
      const transitionsValides = {
        en_attente: ['confirme', 'annule'],
        confirme: ['termine', 'annule'],
        annule: [],
        termine: []
      };

      if (!transitionsValides[rendezVous.statut].includes(req.body.statut)) {
        return res.status(400).json({
          success: false,
          message: `Impossible de passer du statut ${rendezVous.statut} à ${req.body.statut}`
        });
      }
    }

    // Si la date ou l'heure change, vérifier que c'est dans le futur
    if (req.body.date || req.body.heure) {
      const nouvelleDate = new Date(req.body.date || rendezVous.date);
      const nouvelleHeure = req.body.heure || rendezVous.heure;
      const [h, m] = nouvelleHeure.split(':');
      nouvelleDate.setHours(parseInt(h), parseInt(m));

      if (nouvelleDate < maintenant) {
        return res.status(400).json({
          success: false,
          message: 'La nouvelle date doit être dans le futur'
        });
      }

      // Vérifier les horaires d'ouverture
      if (parseInt(h) < 8 || parseInt(h) >= 19) {
        return res.status(400).json({
          success: false,
          message: 'Les rendez-vous doivent être entre 8h et 19h'
        });
      }
    }

    await rendezVous.update(req.body);
    await rendezVous.reload({
      include: [{
        model: Patient,
        attributes: ['nom', 'prenom', 'telephone', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      data: rendezVous
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }
    next(error);
  }
};

// @desc    Annuler un rendez-vous
// @route   DELETE /api/rendezvous/:id
// @access  Private
exports.annulerRendezVous = async (req, res, next) => {
  try {
    const rendezVous = await RendezVous.findOne({
      _id: req.params.id,
      dentiste: req.user.id
    });

    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Vérifier si le rendez-vous est déjà passé
    const dateRdv = new Date(rendezVous.date);
    const [heures, minutes] = rendezVous.heure.split(':');
    dateRdv.setHours(parseInt(heures), parseInt(minutes));

    if (dateRdv < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler un rendez-vous passé'
      });
    }

    // Vérifier si le statut permet l'annulation
    if (!['en_attente', 'confirme'].includes(rendezVous.statut)) {
      return res.status(400).json({
        success: false,
        message: `Impossible d'annuler un rendez-vous ${rendezVous.statut}`
      });
    }

    rendezVous.statut = 'annule';
    await rendezVous.save();

    res.status(200).json({
      success: true,
      message: 'Rendez-vous annulé avec succès',
      data: rendezVous
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirmer un rendez-vous
// @route   PUT /api/rendezvous/:id/confirmer
// @access  Private
exports.deleteRendezVous = async (req, res, next) => {
  try {
    const rendezVous = await RendezVous.findOne({
      where: {
        id: req.params.id,
        dentisteId: req.user.id
      }
    });

    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Supprimer le rendez-vous
    await rendezVous.destroy();

    res.status(200).json({
      success: true,
      message: 'Rendez-vous supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};
