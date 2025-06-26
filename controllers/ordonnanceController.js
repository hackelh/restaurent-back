const { sequelize } = require('../models/sequelize');
const { Op } = require('sequelize');
const Ordonnance = require('../models/sequelize/Ordonnance');
const Patient = require('../models/sequelize/Patient');
const PDFDocument = require('pdfkit');
const moment = require('moment');
moment.locale('fr');

// Vérifier que le patient appartient au dentiste connecté
async function verifyPatientAccess(patientId, dentisteId) {
  const patient = await Patient.findOne({
    where: { id: patientId, dentisteId }
  });
  if (!patient) {
    throw new Error('Patient non trouvé ou accès non autorisé');
  }
  return patient;
}

// Récupérer toutes les ordonnances avec filtres optionnels
exports.getOrdonnances = async (req, res) => {
  try {
    console.log('Début getOrdonnances - Query:', req.query);
    
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

    console.log('Conditions de recherche:', JSON.stringify(whereConditions, null, 2));

    // Construire les conditions de recherche pour le patient
    let patientWhere = {};
    if (search) {
      patientWhere = {
        [Op.or]: [
          { nom: { [Op.like]: `%${search}%` } },
          { prenom: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    console.log('Conditions patient:', JSON.stringify(patientWhere, null, 2));

    const ordonnances = await Ordonnance.findAll({
      where: {
        ...whereConditions,
        dentisteId: req.user.id // Filtre par l'ID du dentiste connecté
      },
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'nom', 'prenom', 'dateNaissance', 'telephone', 'email'],
        where: {
          dentisteId: req.user.id, // S'assure que le patient appartient aussi au dentiste
          ...(Object.keys(patientWhere).length > 0 ? patientWhere : {})
        },
        required: true // Ne retourne que les ordonnances avec des patients valides
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Ordonnances trouvées: ${ordonnances.length}`);

    res.json({
      success: true,
      data: ordonnances
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ordonnances:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ordonnances',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// Récupérer une ordonnance par son ID
exports.getOrdonnanceById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'ID de l\'ordonnance manquant'
      });
    }

    const ordonnance = await Ordonnance.findOne({
      where: { 
        id: req.params.id,
        dentisteId: req.user.id // Assure que seul le dentiste propriétaire peut accéder
      },
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'nom', 'prenom', 'dateNaissance', 'telephone', 'email']
      }]
    });

    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée ou accès non autorisé'
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Créer une nouvelle ordonnance
exports.createOrdonnance = async (req, res) => {
  try {
    const { patientId, contenu, status = 'active', notes } = req.body;

    // Vérifier si le patient existe et appartient au dentiste
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

    // Créer l'ordonnance avec le dentisteId
    const ordonnance = await Ordonnance.create({
      patientId,
      contenu,
      status,
      notes,
      dentisteId: req.user.id,
      date: new Date() // S'assurer que la date est définie
    });

    // Récupérer l'ordonnance avec les informations du patient
    const ordonnanceComplete = await Ordonnance.findOne({
      where: { id: ordonnance.id },
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'nom', 'prenom', 'dateNaissance', 'telephone', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      data: ordonnanceComplete,
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

    const ordonnance = await Ordonnance.findOne({
      where: { id: req.params.id, dentisteId: req.user.id }
    });
    
    if (!ordonnance) {
      return res.status(404).json({ error: 'Ordonnance non trouvée ou accès non autorisé' });
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
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'ID de l\'ordonnance manquant'
      });
    }

    console.log('Tentative de suppression - ID ordonnance:', req.params.id, 'User ID:', req.user?.id);

    // Vérifier d'abord si l'ordonnance existe
    const ordonnance = await Ordonnance.findByPk(req.params.id);

    console.log('Ordonnance trouvée:', ordonnance ? 'Oui' : 'Non');

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
      message: 'Ordonnance supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'ordonnance:', error);
    
    // Gérer les erreurs spécifiques
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer cette ordonnance car elle est liée à d\'autres enregistrements'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'ordonnance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
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
    
    console.log('Tentative de génération PDF - ID ordonnance:', id);
    
    // Récupérer l'ordonnance avec les informations du patient
    const ordonnance = await Ordonnance.findByPk(id, {
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['nom', 'prenom', 'dateNaissance', 'telephone', 'email', 'adresse'],
        required: false // Permettre les ordonnances sans patient
      }]
    });

    console.log('Ordonnance trouvée pour PDF:', ordonnance ? 'Oui' : 'Non');

    if (!ordonnance) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    console.log('Patient associé:', ordonnance.patient ? 'Oui' : 'Non');

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
    if (ordonnance.patient) {
      doc.text(`Nom: ${ordonnance.patient.nom} ${ordonnance.patient.prenom}`);
      if (ordonnance.patient.dateNaissance) {
        doc.text(`Date de naissance: ${moment(ordonnance.patient.dateNaissance).format('DD/MM/YYYY')}`);
      }
      if (ordonnance.patient.adresse) {
        doc.text(`Adresse: ${ordonnance.patient.adresse}`);
      }
      if (ordonnance.patient.telephone) {
        doc.text(`Téléphone: ${ordonnance.patient.telephone}`);
      }
    } else {
      doc.text('Patient: Informations non disponibles');
    }

    doc.moveDown();

    // Date de l'ordonnance
    doc.text(`Date: ${moment(ordonnance.createdAt || ordonnance.date).format('DD/MM/YYYY')}`);
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
