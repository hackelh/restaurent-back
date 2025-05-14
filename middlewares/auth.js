const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const { User } = require('../models/sequelize');

exports.verifyToken = async (req, res, next) => {
  try {
    console.log('Headers reçus:', req.headers);
    let token;

    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extrait:', token);
    }

    // Vérifier si le token existe
    if (!token) {
      console.log('Aucun token trouvé');
      return res.status(401).json({
        success: false,
        message: 'Non autorisé à accéder à cette route - Token manquant'
      });
    }

    try {
      // Vérifier le token
      console.log('Vérification du token avec JWT_SECRET:', JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token décodé:', decoded);

      // Ajouter l'utilisateur à la requête
      const user = await User.findByPk(decoded.id);
      if (!user) {
        console.log('Utilisateur non trouvé pour l\'ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'Non autorisé - Utilisateur non trouvé'
        });
      }
      console.log('Utilisateur trouvé:', user.id);
      req.user = user;
      next();
    } catch (err) {
      console.error('Erreur de vérification du token:', err);
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
        error: err.message
      });
    }
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification',
      error: error.message
    });
  }
};
