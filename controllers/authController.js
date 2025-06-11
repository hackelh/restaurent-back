const { User } = require('../models/sequelize');

// @desc    Inscription d'un utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation des champs requis
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un nom, un email et un mot de passe'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
      role: 'dentist' // Définir un rôle par défaut
    });

    // Générer le token
    const token = user.getSignedJwtToken();

    // Préparer la réponse
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Valider email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Générer le token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les informations de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Déconnexion / Effacer le cookie
// @route   POST /api/auth/logout
// @access  Private

exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    next(error);
  }
};
