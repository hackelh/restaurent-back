const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database').sequelize;
const Patient = require('./Patient');
const User = require('./User');

const Ordonnance = sequelize.define('Ordonnance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  notes: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  dentisteId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'ordonnances',
  timestamps: false
});

Ordonnance.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(Ordonnance, { foreignKey: 'patientId', as: 'ordonnancesSQL' });
Ordonnance.belongsTo(User, { foreignKey: 'dentisteId', as: 'dentiste' });
User.hasMany(Ordonnance, { foreignKey: 'dentisteId', as: 'ordonnancesDentiste' });

module.exports = Ordonnance;
