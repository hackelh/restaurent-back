const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Appointment = sequelize.define('Appointment', {
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
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'consultation'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'missed'),
    defaultValue: 'pending',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'appointments'
});

module.exports = Appointment;
