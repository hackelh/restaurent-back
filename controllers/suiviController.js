const Suivi = require('../models/Suivi');

// @desc    Obtenir tous les suivis d'un patient
// @route   GET /api/patients/:patientId/suivis
// @access  Private
exports.getSuivis = async (req, res, next) => {
  try {
    const suivis = await Suivi.find({
      patient: req.params.patientId,
      dentiste: req.user.id
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: suivis.length,
      data: suivis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir un suivi spécifique
// @route   GET /api/suivis/:id
// @access  Private
exports.getSuivi = async (req, res, next) => {
  try {
    const suivi = await Suivi.findOne({
      _id: req.params.id,
      dentiste: req.user.id
    }).populate('patient', 'nom prenom');

    if (!suivi) {
      return res.status(404).json({
        success: false,
        message: 'Suivi non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: suivi
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un nouveau suivi
// @route   POST /api/patients/:patientId/suivis
// @access  Private
exports.createSuivi = async (req, res, next) => {
  try {
    req.body.patient = req.params.patientId;
    req.body.dentiste = req.user.id;

    const suivi = await Suivi.create(req.body);

    res.status(201).json({
      success: true,
      data: suivi
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour un suivi
// @route   PUT /api/suivis/:id
// @access  Private
exports.updateSuivi = async (req, res, next) => {
  try {
    let suivi = await Suivi.findOne({
      _id: req.params.id,
      dentiste: req.user.id
    });

    if (!suivi) {
      return res.status(404).json({
        success: false,
        message: 'Suivi non trouvé'
      });
    }

    suivi = await Suivi.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: suivi
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un suivi
// @route   DELETE /api/suivis/:id
// @access  Private
exports.deleteSuivi = async (req, res, next) => {
  try {
    const suivi = await Suivi.findOne({
      _id: req.params.id,
      dentiste: req.user.id
    });

    if (!suivi) {
      return res.status(404).json({
        success: false,
        message: 'Suivi non trouvé'
      });
    }

    await suivi.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter un document à un suivi
// @route   POST /api/suivis/:id/documents
// @access  Private
exports.ajouterDocument = async (req, res, next) => {
  try {
    const suivi = await Suivi.findOne({
      _id: req.params.id,
      dentiste: req.user.id
    });

    if (!suivi) {
      return res.status(404).json({
        success: false,
        message: 'Suivi non trouvé'
      });
    }

    suivi.documents.push(req.body);
    await suivi.save();

    res.status(200).json({
      success: true,
      data: suivi
    });
  } catch (error) {
    next(error);
  }
};
