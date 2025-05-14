const { Patient, RendezVous } = require('../models/sequelize');
const { Op } = require('sequelize');

// @desc    Obtenir tous les patients avec filtres et pagination
// @route   GET /api/patients
// @access  Private
exports.getPatients = async (req, res, next) => {
  try {
    console.log('Début getPatients');
    console.log('User:', req.user ? { id: req.user.id, email: req.user.email } : 'Non authentifié');
    console.log('Headers:', req.headers);
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Vérifier si l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      console.log('Utilisateur non authentifié');
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier la structure de la table Patient
    console.log('Structure de la table Patient:', Object.keys(Patient.rawAttributes));

    const whereClause = { dentisteId: req.user.id };
    console.log('WhereClause:', JSON.stringify(whereClause));

    // Filtres
    if (req.query.search) {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${req.query.search}%` } },
        { prenom: { [Op.like]: `%${req.query.search}%` } },
        { email: { [Op.like]: `%${req.query.search}%` } },
        { numeroSecu: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    console.log('Exécution de la requête findAndCountAll avec les paramètres suivants:');
    console.log('Where:', JSON.stringify(whereClause));
    console.log('Offset:', startIndex);
    console.log('Limit:', limit);

    // Exécuter la requête
    const { count, rows: patients } = await Patient.findAndCountAll({
      where: whereClause,
      attributes: { 
        exclude: ['notesMedicales'],
        include: [
          'id', 'nom', 'prenom', 'email', 'telephone', 'numeroSecu', 'status', 'dentisteId'
        ]
      },
      offset: startIndex,
      limit: limit,
      order: [['nom', 'ASC'], ['prenom', 'ASC']]
    });

    console.log('Résultat de la requête:');
    console.log('Count:', count);
    console.log('Nombre de patients:', patients.length);
    if (patients.length > 0) {
      console.log('Premier patient:', {
        id: patients[0].id,
        nom: patients[0].nom,
        dentisteId: patients[0].dentisteId
      });
    }

    const total = count;
    const response = {
      success: true,
      count: patients.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: patients
    };

    console.log('Envoi de la réponse avec', patients.length, 'patients');
    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur détaillée dans getPatients:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Type d\'erreur:', error.name);
    if (error.parent) {
      console.error('Erreur SQL:', {
        code: error.parent.code,
        errno: error.parent.errno,
        sqlMessage: error.parent.sqlMessage,
        sqlState: error.parent.sqlState
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des patients',
      error: {
        message: error.message,
        type: error.name,
        sql: error.parent ? error.parent.sqlMessage : null
      }
    });
  }
};

// @desc    Obtenir un patient avec son historique complet
// @route   GET /api/patients/:id
// @access  Private
exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      where: {
        id: req.params.id,
        dentisteId: req.user.id
      },
      include: [
        {
          model: RendezVous,
          order: [['date', 'DESC']]
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Les rendez-vous sont déjà inclus dans le patient grâce à l'include

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un patient
// @route   POST /api/patients
// @access  Private
exports.createPatient = async (req, res, next) => {
  try {
    // Vérifier si le numéro de sécu existe déjà
    const existingPatient = await Patient.findOne({
      where: {
        numeroSecu: req.body.numeroSecu
      }
    });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Un patient avec ce numéro de sécurité sociale existe déjà'
      });
    }

    // Ajouter l'ID du dentiste
    req.body.dentisteId = req.user.id;

    // Valider et formater les données
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }
    if (req.body.telephone) {
      req.body.telephone = req.body.telephone.replace(/\s/g, '');
    }

    // S'assurer que l'adresse a tous les champs requis
    if (!req.body.adresse || !req.body.adresse.rue || !req.body.adresse.codePostal || !req.body.adresse.ville || !req.body.adresse.pays) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs d\'adresse sont requis (rue, code postal, ville, pays)'
      });
    }

    // Formater la date de naissance
    if (req.body.dateNaissance) {
      req.body.dateNaissance = new Date(req.body.dateNaissance).toISOString();
    }

    const patient = await Patient.create(req.body);

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Erreur lors de la création du patient:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du patient',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un patient
// @route   PUT /api/patients/:id
// @access  Private
exports.updatePatient = async (req, res, next) => {
  try {
    let patient = await Patient.findOne({
      where: {
        id: req.params.id,
        dentisteId: req.user.id
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérifier le numéro de sécu s'il est modifié
    if (req.body.numeroSecu && req.body.numeroSecu !== patient.numeroSecu) {
      const existingPatient = await Patient.findOne({ numeroSecu: req.body.numeroSecu });
      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: 'Un patient avec ce numéro de sécurité sociale existe déjà'
        });
      }
    }

    // Formater les données si nécessaire
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }
    if (req.body.telephone) {
      req.body.telephone = req.body.telephone.replace(/\s/g, '');
    }

    await patient.update(req.body);
    await patient.reload();

    res.status(200).json({
      success: true,
      data: patient
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

// @desc    Archiver/Désarchiver un patient (soft delete)
// @route   DELETE /api/patients/:id
// @access  Private
exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      where: {
        id: req.params.id,
        dentisteId: req.user.id
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Basculer entre archivé et actif
    const newStatus = patient.status === 'archive' ? 'actif' : 'archive';
    await patient.update({ status: newStatus });

    res.status(200).json({
      success: true,
      message: `Patient ${newStatus === 'archive' ? 'archivé' : 'désarchivé'} avec succès`,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter une ordonnance à un patient
// @route   POST /api/patients/:id/ordonnances
// @access  Private
exports.ajouterOrdonnance = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      dentiste: req.user.id
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    const ordonnance = await patient.createOrdonnance(req.body);

    res.status(201).json({
      success: true,
      data: patient.ordonnances[patient.ordonnances.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter une pathologie à un patient
// @route   POST /api/patients/:id/pathologies
// @access  Private
exports.ajouterPathologie = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      dentiste: req.user.id
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    const pathologie = await patient.createPathologie(req.body);

    res.status(201).json({
      success: true,
      data: patient.pathologies[patient.pathologies.length - 1]
    });
  } catch (error) {
    next(error);
  }
};
