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

    // Désactiver temporairement les contraintes de clé étrangère
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Synchroniser chaque modèle individuellement dans le bon ordre
    const models = [
      require('../models/sequelize/User'),
      require('../models/sequelize/Patient'),
      require('../models/sequelize/RendezVous'),
      require('../models/sequelize/SuiviMedical'),
      require('../models/sequelize/Ordonnance')
    ];

    for (const model of models) {
      await model.sync({ force: true });
      console.log(`Table ${model.name} synchronized`);
    }

    // Réactiver les contraintes de clé étrangère
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
