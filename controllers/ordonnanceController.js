const Ordonnance = require('../models/sequelize/Ordonnance');
const Patient = require('../models/sequelize/Patient');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const moment = require('moment');
moment.locale('fr');

// Récupérer toutes les ordonnances avec filtres optionnels
exports.getOrdonnances = async (req, res) => {
  try {
    const { patientId, status, startDate, endDate, search } = req.query;
    const where = {};

    // Appliquer les filtres si présents
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const ordonnances = await Ordonnance.findAll({
      where,
      include: [{
        model: Patient,
        attributes: ['id', 'nom', 'prenom', 'telephone', 'email'],
        where: search ? {
          [Op.or]: [
            { nom: { [Op.like]: `%${search}%` } },
            { prenom: { [Op.like]: `%${search}%` } }
          ]
        } : undefined
      }],
      order: [['date', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: ordonnances.length,
      data: ordonnances
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ordonnances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ordonnances',
      error: error.message
    });
  }
};

// Récupérer une ordonnance par son ID
exports.getOrdonnanceById = async (req, res) => {
  try {
    const ordonnance = await Ordonnance.findByPk(req.params.id, {
      include: [{
        model: Patient,
        attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
      }]
    });

    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: ordonnance
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ordonnance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'ordonnance',
      error: error.message
    });
  }
};

// Créer une nouvelle ordonnance
exports.createOrdonnance = async (req, res) => {
  try {
    const { patientId, contenu, status, notes } = req.body;

    // Validation des données
    if (!patientId || !contenu) {
      return res.status(400).json({
        success: false,
        message: 'Le patientId et le contenu sont requis'
      });
    }

    // Vérifier si le patient existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Créer l'ordonnance
    const ordonnance = await Ordonnance.create({
      patientId,
      contenu: typeof contenu === 'string' ? contenu : JSON.stringify(contenu),
      status: status || 'active',
      notes,
      date: new Date()
    });

    // Récupérer l'ordonnance avec les informations du patient
    const ordonnanceWithPatient = await Ordonnance.findByPk(ordonnance.id, {
      include: [{
        model: Patient,
        attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Ordonnance créée avec succès',
      data: ordonnanceWithPatient
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'ordonnance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'ordonnance',
      error: error.message
    });
  }
};

// Mettre à jour une ordonnance
exports.updateOrdonnance = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, contenu, status, notes } = req.body;

    // Vérifier si l'ordonnance existe
    const ordonnance = await Ordonnance.findByPk(id);
    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    // Si patientId est modifié, vérifier si le nouveau patient existe
    if (patientId && patientId !== ordonnance.patientId) {
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Nouveau patient non trouvé'
        });
      }
    }

    // Mettre à jour l'ordonnance
    await ordonnance.update({
      patientId: patientId || ordonnance.patientId,
      contenu: contenu ? (typeof contenu === 'string' ? contenu : JSON.stringify(contenu)) : ordonnance.contenu,
      status: status || ordonnance.status,
      notes: notes !== undefined ? notes : ordonnance.notes
    });

    // Récupérer l'ordonnance mise à jour avec les informations du patient
    const updatedOrdonnance = await Ordonnance.findByPk(id, {
      include: [{
        model: Patient,
        attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Ordonnance mise à jour avec succès',
      data: updatedOrdonnance
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'ordonnance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'ordonnance',
      error: error.message
    });
  }
};

// Supprimer une ordonnance
exports.deleteOrdonnance = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'ordonnance existe
    const ordonnance = await Ordonnance.findByPk(id);
    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    // Supprimer l'ordonnance
    await ordonnance.destroy();

    res.status(200).json({
      success: true,
      message: 'Ordonnance supprimée avec succès',
      data: { id }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'ordonnance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'ordonnance',
      error: error.message
    });
  }
};

// Changer le statut d'une ordonnance
exports.updateOrdonnanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation du statut
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Les statuts valides sont : ' + validStatuses.join(', ')
      });
    }

    // Vérifier si l'ordonnance existe
    const ordonnance = await Ordonnance.findByPk(id);
    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    // Mettre à jour le statut
    await ordonnance.update({ status });

    // Récupérer l'ordonnance mise à jour avec les informations du patient
    const updatedOrdonnance = await Ordonnance.findByPk(id, {
      include: [{
        model: Patient,
        attributes: ['id', 'nom', 'prenom', 'telephone', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Statut de l\'ordonnance mis à jour avec succès',
      data: updatedOrdonnance
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'ordonnance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de l\'ordonnance',
      error: error.message
    });
  }
};
