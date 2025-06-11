const User = require('./User');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const SuiviMedical = require('./SuiviMedical');
const Ordonnance = require('./Ordonnance');
const Antecedent = require('./Antecedent');

// Relations User (Dentiste)
User.hasMany(Patient, { foreignKey: 'dentisteId' });
Patient.belongsTo(User, { foreignKey: 'dentisteId' });

// Relations Patient-Appointment
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });

// Suppression de l'association Antecedent car on utilise maintenant un champ JSON dans Patient

// Relations Appointment-Dentiste (User)
Appointment.belongsTo(User, { as: 'dentiste', foreignKey: 'dentisteId' });
User.hasMany(Appointment, { foreignKey: 'dentisteId' });

// Relations SuiviMedical-Patient
SuiviMedical.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(SuiviMedical, { foreignKey: 'patientId', as: 'suivis' });

module.exports = {
  User,
  Patient,
  Appointment,
  SuiviMedical,
  Ordonnance,
  Antecedent
};
