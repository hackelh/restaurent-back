const { body, param, query, validationResult } = require('express-validator');

// Middleware de validation
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(errors.array());
    }
    next();
};

// Validation du suivi médical
const validateSuiviMedical = [
    body('patientId')
        .notEmpty()
        .withMessage('ID du patient requis')
        .isMongoId()
        .withMessage('ID du patient invalide'),
    
    body('dateConsultation')
        .notEmpty()
        .withMessage('Date de consultation requise')
        .isISO8601()
        .withMessage('Format de date invalide'),
    
    body('pathologie')
        .notEmpty()
        .withMessage('Pathologie requise')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('La pathologie doit contenir entre 2 et 200 caractères'),
    
    body('traitement')
        .notEmpty()
        .withMessage('Traitement requis')
        .trim()
        .isLength({ min: 2, max: 500 })
        .withMessage('Le traitement doit contenir entre 2 et 500 caractères'),
    
    body('notesDentiste')
        .notEmpty()
        .withMessage('Notes du dentiste requises')
        .trim()
        .isLength({ min: 2, max: 1000 })
        .withMessage('Les notes doivent contenir entre 2 et 1000 caractères'),
    
    body('ordonnancePDF')
        .optional()
        .isString()
        .withMessage('Le chemin du PDF doit être une chaîne de caractères'),
    
    validate
];

// Validation des rendez-vous
const validateRendezVous = [
    body('patientId')
        .notEmpty()
        .withMessage('ID du patient requis')
        .isMongoId()
        .withMessage('ID du patient invalide'),
    
    body('date')
        .notEmpty()
        .withMessage('Date requise')
        .isISO8601()
        .withMessage('Format de date invalide'),
    
    body('motif')
        .notEmpty()
        .withMessage('Motif requis')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Le motif doit contenir entre 2 et 200 caractères'),
    
    body('statut')
        .optional()
        .isIn(['planifié', 'confirmé', 'annulé', 'terminé'])
        .withMessage('Statut invalide'),
    
    validate
];

// Validation des paramètres de pagination
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Le numéro de page doit être un entier positif'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('La limite doit être entre 1 et 100'),
    
    validate
];

// Validation des paramètres MongoDB ID
const validateMongoId = [
    param('id')
        .isMongoId()
        .withMessage('ID invalide'),
    validate
];

module.exports = {
    validateSuiviMedical,
    validateRendezVous,
    validatePagination,
    validateMongoId
};
