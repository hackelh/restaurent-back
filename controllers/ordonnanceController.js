const Ordonnance = require('../models/sequelize/Ordonnance');
const Patient = require('../models/sequelize/Patient');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const moment = require('moment');
moment.locale('fr');

// Récupérer toutes les ordonnances avec filtres optionnels
exports.getOrdonnances = async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;
    
    // Construire les conditions de recherche
    let whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const ordonnances = await Ordonnance.findAll({
      where: whereConditions,
      include: [{
        model: Patient,
        attributes: ['nom', 'prenom', 'dateNaissance', 'telephone', 'email'],
        where: search ? {
          [Op.or]: [
            { nom: { [Op.like]: `%${search}%` } },
            { prenom: { [Op.like]: `%${search}%` } }
          ]
        } : undefined
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
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
    const { id } = req.params;
    const ordonnance = await Ordonnance.findByPk(id, {
      include: [{
        model: Patient,
        attributes: ['nom', 'prenom', 'dateNaissance', 'telephone', 'email']
      }]
    });

    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    res.json({
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
    const { patientId, contenu, status = 'active', notes } = req.body;

    // Vérifier si le patient existe
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    const ordonnance = await Ordonnance.create({
      patientId,
      contenu,
      status,
      notes
    });

    res.status(201).json({
      success: true,
      data: ordonnance,
      message: 'Ordonnance créée avec succès'
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
    const { patientId, contenu, notes } = req.body;

    const ordonnance = await Ordonnance.findByPk(id);
    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    if (patientId) {
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient non trouvé'
        });
      }
    }

    await ordonnance.update({
      patientId: patientId || ordonnance.patientId,
      contenu: contenu || ordonnance.contenu,
      notes: notes || ordonnance.notes
    });

    res.json({
      success: true,
      data: ordonnance,
      message: 'Ordonnance mise à jour avec succès'
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
    const ordonnance = await Ordonnance.findByPk(id);

    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    await ordonnance.destroy();

    res.json({
      success: true,
      message: 'Ordonnance supprimée avec succès'
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

// Mettre à jour le statut d'une ordonnance
exports.updateOrdonnanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const ordonnance = await Ordonnance.findByPk(id);
    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    await ordonnance.update({ status });

    res.json({
      success: true,
      data: ordonnance,
      message: 'Statut de l\'ordonnance mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// Générer un PDF pour une ordonnance
exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'ordonnance avec les informations du patient
    const ordonnance = await Ordonnance.findByPk(id, {
      include: [{
        model: Patient,
        attributes: ['nom', 'prenom', 'dateNaissance', 'telephone', 'email', 'adresse']
      }]
    });

    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    // Créer un nouveau document PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // En-têtes pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ordonnance_${id}.pdf`);

    // Pipe le PDF vers la réponse
    doc.pipe(res);

    // En-tête du document
    doc.fontSize(20).text('ORDONNANCE MÉDICALE', { align: 'center' });
    doc.moveDown();

    // Informations du patient
    doc.fontSize(12);
    doc.text('PATIENT:', { underline: true });
    doc.text(`Nom: ${ordonnance.Patient.nom} ${ordonnance.Patient.prenom}`);
    if (ordonnance.Patient.dateNaissance) {
      doc.text(`Date de naissance: ${moment(ordonnance.Patient.dateNaissance).format('DD/MM/YYYY')}`);
    }
    if (ordonnance.Patient.adresse) {
      doc.text(`Adresse: ${ordonnance.Patient.adresse}`);
    }
    if (ordonnance.Patient.telephone) {
      doc.text(`Téléphone: ${ordonnance.Patient.telephone}`);
    }

    doc.moveDown();

    // Date de l'ordonnance
    doc.text(`Date: ${moment(ordonnance.createdAt).format('DD/MM/YYYY')}`);
    doc.moveDown();

    // Contenu de l'ordonnance
    doc.text('PRESCRIPTION:', { underline: true });
    doc.moveDown();

    // Formatter le contenu
    const contenu = typeof ordonnance.contenu === 'string' 
      ? ordonnance.contenu 
      : JSON.stringify(ordonnance.contenu, null, 2);

    doc.font('Courier').fontSize(10).text(contenu);
    doc.moveDown();

    // Notes si présentes
    if (ordonnance.notes) {
      doc.font('Helvetica').fontSize(12);
      doc.text('Notes:', { underline: true });
      doc.text(ordonnance.notes);
    }

    // Pied de page
    doc.moveDown();
    doc.fontSize(10).text('Cette ordonnance a été générée électroniquement.', { align: 'center' });

    // Finaliser le PDF
    doc.end();

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
};
