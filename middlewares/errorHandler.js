// Middleware de gestion des erreurs
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            error: 'Erreur de validation',
            messages
        });
    }

    // Erreurs de validation express-validator
    if (Array.isArray(err) && err[0]?.msg) {
        return res.status(400).json({
            success: false,
            error: 'Erreur de validation',
            messages: err.map(e => e.msg)
        });
    }

    // Erreur de duplication MongoDB
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            error: 'Cette entrée existe déjà'
        });
    }

    // Erreur d'ID invalide MongoDB
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Identifiant invalide'
        });
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Token invalide'
        });
    }

    // Erreur JWT expirée
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expiré'
        });
    }

    // Erreur par défaut
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Erreur serveur'
    });
};

module.exports = errorHandler;
