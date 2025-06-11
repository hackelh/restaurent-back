const { Patient, Appointment, SuiviMedical, Ordonnance } = require('../models/sequelize');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Récupérer tous les patients
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll({
      where: { dentisteId: req.user.id },
      order: [['nom', 'ASC']]
    });
    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des patients'
    });
  }
};

// Récupérer un patient par son ID
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { 
        id: req.params.id, 
        dentisteId: req.user.id 
      },
      // On inclut uniquement les rendez-vous récents
      include: [{
        model: Appointment,
        as: 'appointments',
        required: false,
        order: [['date', 'DESC']],
        limit: 5
      }]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Assure-toi que antecedentsMedicaux est toujours un tableau
    if (!patient.antecedentsMedicaux) {
      patient.antecedentsMedicaux = [];
    }

    res.json({ 
      success: true, 
      data: patient 
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour un patient
exports.updatePatient = async (req, res) => {
  try {
    console.log('Données reçues pour mise à jour patient:', req.body);

    // Valider les champs requis
    if (req.body.nom === '' || req.body.prenom === '' || req.body.telephone === '' || req.body.dateNaissance === '') {
      return res.status(400).json({
        success: false,
        message: 'Les champs obligatoires ne peuvent pas être vides'
      });
    }

    // Préparer les données pour la mise à jour
    const updateData = { ...req.body };
    
    // S'assurer que antecedentsMedicaux est un tableau
    if (updateData.antecedentsMedicaux !== undefined) {
      updateData.antecedentsMedicaux = Array.isArray(updateData.antecedentsMedicaux)
        ? updateData.antecedentsMedicaux
        : [];
    }

    const [updated] = await Patient.update(updateData, {
      where: { 
        id: req.params.id, 
        dentisteId: req.user.id 
      },
      returning: true,
      individualHooks: true
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé ou accès non autorisé'
      });
    }

    // Récupérer le patient mis à jour
    const patient = await Patient.findByPk(req.params.id);
    
    res.json({ 
      success: true, 
      data: patient 
    });

  } catch (error) {
    console.error('Erreur détaillée:', error);
    
    // Gestion spécifique des erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.reduce((acc, curr) => ({
          ...acc,
          [curr.field]: curr.message
        }), {})
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du patient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Créer un nouveau patient
exports.createPatient = async (req, res) => {
  try {
    console.log('Données reçues pour création patient:', req.body);
    
    // Valider les champs requis
    if (!req.body.nom || !req.body.prenom || !req.body.telephone || !req.body.dateNaissance) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis',
        errors: {
          nom: !req.body.nom ? 'Le nom est requis' : undefined,
          prenom: !req.body.prenom ? 'Le prénom est requis' : undefined,
          telephone: !req.body.telephone ? 'Le téléphone est requis' : undefined,
          dateNaissance: !req.body.dateNaissance ? 'La date de naissance est requise' : undefined
        }
      });
    }

    const patient = await Patient.create({
      ...req.body,
      dentisteId: req.user.id,
      // S'assurer que antecedentsMedicaux est un tableau
      antecedentsMedicaux: Array.isArray(req.body.antecedentsMedicaux) 
        ? req.body.antecedentsMedicaux 
        : []
    });

    res.status(201).json({ 
      success: true, 
      data: patient 
    });

  } catch (error) {
    console.error('Erreur détaillée:', error);
    
    // Gestion spécifique des erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.reduce((acc, curr) => ({
          ...acc,
          [curr.field]: curr.message
        }), {})
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du patient',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Supprimer un patient (soft delete)
exports.deletePatient = async (req, res) => {
  try {
    // Supprimer tous les rendez-vous liés dans toutes les tables possibles
    await Appointment.destroy({ where: { patientId: req.params.id } });
    await sequelize.query("DELETE FROM appointments WHERE patientId = ?", { replacements: [req.params.id] });
    await sequelize.query("DELETE FROM rendezvous WHERE patientId = ?", { replacements: [req.params.id] });
    await sequelize.query("DELETE FROM rendez_vous WHERE patientId = ?", { replacements: [req.params.id] });
    // Supprimer les suivis médicaux liés
    await SuiviMedical.destroy({ where: { patientId: req.params.id } });
    // Supprimer les ordonnances liées
    await Ordonnance.destroy({ where: { patientId: req.params.id } });

    // Supprimer le patient
    const deleted = await Patient.destroy({
      where: { 
        id: req.params.id, 
        dentisteId: req.user.id 
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    res.json({ 
      success: true,
      message: 'Patient supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};

// Ajouter une ordonnance à un patient
exports.ajouterOrdonnance = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérifier que l'utilisateur est autorisé à modifier ce patient
    if (patient.dentisteId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const { medicaments, datePrescription, remarques } = req.body;
    
    if (!medicaments || !Array.isArray(medicaments) || medicaments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir au moins un médicament'
      });
    }

    const nouvelleOrdonnance = {
      id: Date.now().toString(),
      date: datePrescription || new Date(),
      medicaments,
      remarques: remarques || ''
    };

    // Initialiser le tableau des ordonnances s'il n'existe pas
    if (!patient.ordonnances) {
      patient.ordonnances = [];
    }

    patient.ordonnances.push(nouvelleOrdonnance);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Ordonnance ajoutée avec succès',
      data: nouvelleOrdonnance
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'ordonnance'
    });
  }
};

// Ajouter une pathologie à un patient
exports.ajouterPathologie = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérifier que l'utilisateur est autorisé à modifier ce patient
    if (patient.dentisteId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const { nom, dateDebut, dateFin, traitement, remarques } = req.body;
    
    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la pathologie est requis'
      });
    }

    const nouvellePathologie = {
      id: Date.now().toString(),
      nom,
      dateDebut: dateDebut || new Date(),
      dateFin: dateFin || null,
      traitement: traitement || '',
      remarques: remarques || '',
      dateCreation: new Date()
    };

    // Initialiser le tableau des pathologies s'il n'existe pas
    if (!patient.pathologies) {
      patient.pathologies = [];
    }

    patient.pathologies.push(nouvellePathologie);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Pathologie ajoutée avec succès',
      data: nouvellePathologie
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la pathologie'
    });
  }
};

// Ajouter une ordonnance au tableau JSON du patient (ultra simple)
exports.ajouterOrdonnanceJSON = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient non trouvé' });
    }

    const { contenu, notes } = req.body;
    if (!contenu) {
      return res.status(400).json({ success: false, message: 'Le contenu est requis' });
    }

    const nouvelleOrdonnance = {
      id: Date.now(),
      contenu,
      notes: notes || '',
      date: new Date()
    };

    // Ajoute l'ordonnance au tableau JSON
    patient.ordonnances = Array.isArray(patient.ordonnances) ? patient.ordonnances : [];
    patient.ordonnances.push(nouvelleOrdonnance);
    await patient.save();

    res.status(201).json({ success: true, data: nouvelleOrdonnance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout de l\'ordonnance' });
  }
};