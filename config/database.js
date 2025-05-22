const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: config.DB_HOST,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: config.DB_PORT,
  logging: console.log, // Activer le logging SQL
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected successfully.');

    // Synchroniser les modèles sans forcer la recréation des tables
    const models = [
      require('../models/sequelize/User'),
      require('../models/sequelize/Patient'),
      require('../models/sequelize/RendezVous'),
      require('../models/sequelize/SuiviMedical'),
      require('../models/sequelize/Ordonnance')
    ];

    // Synchroniser tous les modèles sans forcer la recréation
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
