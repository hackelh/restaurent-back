const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const RendezVous = sequelize.define('RendezVous', {
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'consultation'
  },
  duree: {
    type: DataTypes.INTEGER,
    defaultValue: 30 // durée en minutes
  },
  notes: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  dentisteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'rendez_vous'
});

module.exports = RendezVous;
