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

    console.log('Chargement des modèles...');
    // Charger les modèles
    const models = {
      User: require('../models/sequelize/User'),
      Patient: require('../models/sequelize/Patient'),
      Appointment: require('../models/sequelize/Appointment'),
      SuiviMedical: require('../models/sequelize/SuiviMedical'),
      Ordonnance: require('../models/sequelize/Ordonnance')
    };

    console.log('Modèles chargés:', Object.keys(models));

    // Vérifier les tables existantes
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('Tables existantes dans la base de données:', results.map(r => Object.values(r)[0]));

    // Synchroniser tous les modèles avec alter: true pour mettre à jour le schéma si nécessaire
    console.log('Début de la synchronisation de la base de données...');
    await sequelize.sync({ alter: { drop: false } });
    console.log('Base de données synchronisée avec succès');
    
    // Vérifier la structure de la table Ordonnances
    try {
      const [columns] = await sequelize.query("SHOW COLUMNS FROM Ordonnances");
      console.log('Colonnes de la table Ordonnances:', columns.map(c => c.Field));
    } catch (err) {
      console.error('Erreur lors de la vérification de la table Ordonnances:', err.message);
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
