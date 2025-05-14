const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const SuiviMedical = sequelize.define('SuiviMedical', {
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  traitement: {
    type: DataTypes.TEXT
  },
  ordonnance: {
    type: DataTypes.JSON,
    defaultValue: {
      titre: '',
      fichierUrl: '',
      medicaments: []
    }
  },
  notes: {
    type: DataTypes.TEXT
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  }
});

module.exports = SuiviMedical;