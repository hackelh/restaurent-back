require('dotenv').config();
const { MongoClient } = require('mongodb');
const { User, Patient, RendezVous, SuiviMedical } = require('../models/sequelize');
const { sequelize } = require('../config/database');

async function migrateData() {
  // Connexion à MongoDB
  const mongoClient = new MongoClient(process.env.OLD_MONGODB_URI);
  
  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    
    const db = mongoClient.db();
    
    // Synchroniser les modèles Sequelize
    await sequelize.sync({ force: true }); // Attention: cela va supprimer toutes les données existantes
    console.log('MySQL tables created');
    
    // Migrer les utilisateurs
    const users = await db.collection('users').find({}).toArray();
    for (const user of users) {
      await User.create({
        name: user.name,
        email: user.email,
        password: user.password, // Le mot de passe est déjà hashé
        role: user.role
      });
    }
    console.log(`${users.length} users migrated`);
    
    // Migrer les patients
    const patients = await db.collection('patients').find({}).toArray();
    for (const patient of patients) {
      await Patient.create({
        nom: patient.nom,
        prenom: patient.prenom,
        email: patient.email,
        telephone: patient.telephone,
        dateNaissance: patient.dateNaissance,
        adresse: patient.adresse,
        groupeSanguin: patient.groupeSanguin,
        allergies: patient.allergies || [],
        notesMedicales: patient.notesMedicales,
        numeroSecu: patient.numeroSecu,
        status: patient.status,
        dentisteId: patient.dentiste
      });
    }
    console.log(`${patients.length} patients migrated`);
    
    // Migrer les rendez-vous
    const rendezvous = await db.collection('rendezvous').find({}).toArray();
    for (const rdv of rendezvous) {
      await RendezVous.create({
        date: rdv.date,
        heure: rdv.heure,
        duree: rdv.duree,
        motif: rdv.motif,
        notes: rdv.notes,
        status: rdv.status,
        patientId: rdv.patient,
        dentisteId: rdv.dentiste
      });
    }
    console.log(`${rendezvous.length} rendez-vous migrated`);
    
    // Migrer les suivis médicaux
    const suivis = await db.collection('suivimedicaux').find({}).toArray();
    for (const suivi of suivis) {
      await SuiviMedical.create({
        date: suivi.date,
        description: suivi.description,
        traitement: suivi.traitement,
        ordonnance: suivi.ordonnance,
        notes: suivi.notes,
        patientId: suivi.patient,
        dentisteId: suivi.dentiste
      });
    }
    console.log(`${suivis.length} suivis médicaux migrated`);
    
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoClient.close();
    await sequelize.close();
  }
}

migrateData();
