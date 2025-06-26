const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Historique = sequelize.define('Historique', {
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  date_heure: {
    type: DataTypes.DATE,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  statut: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'historiques'
});

module.exports = Historique; 