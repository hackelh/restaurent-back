const User = require('./User');
const Patient = require('./Patient');
const RendezVous = require('./RendezVous');
const SuiviMedical = require('./SuiviMedical');

// Relations User (Dentiste)
User.hasMany(Patient, { foreignKey: 'dentisteId' });
Patient.belongsTo(User, { foreignKey: 'dentisteId' });

// Relations Patient-RendezVous
RendezVous.belongsTo(Patient, { foreignKey: 'patientId' });
Patient.hasMany(RendezVous, { foreignKey: 'patientId' });

// Relations RendezVous-Dentiste (User)
RendezVous.belongsTo(User, { as: 'dentiste', foreignKey: 'dentisteId' });
User.hasMany(RendezVous, { foreignKey: 'dentisteId' });

// Relations Patient-SuiviMedical
SuiviMedical.belongsTo(Patient, { foreignKey: 'patientId' });
Patient.hasMany(SuiviMedical, { foreignKey: 'patientId' });

module.exports = {
  User,
  Patient,
  RendezVous,
  SuiviMedical
};
