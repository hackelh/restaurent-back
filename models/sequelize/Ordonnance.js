const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database').sequelize;
const Patient = require('./Patient');

const Ordonnance = sequelize.define('Ordonnance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  notes: {
    type: DataTypes.TEXT
  }
});

// Relation avec Patient
Ordonnance.belongsTo(Patient, {
  foreignKey: {
    name: 'patientId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

Patient.hasMany(Ordonnance, {
  foreignKey: 'patientId'
});

module.exports = Ordonnance;
