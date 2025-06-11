const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Patient = sequelize.define('Patient', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateNaissance: {
    type: DataTypes.DATE,
    allowNull: false
  },
  adresse: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      rue: '',
      complementAdresse: '',
      codePostal: '',
      ville: '',
      pays: 'France'
    }
  },
  numeroSecu: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('actif', 'inactif', 'archive'),
    defaultValue: 'actif'
  },
  antecedentsMedicaux: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('antecedentsMedicaux');
      return Array.isArray(rawValue) ? rawValue : [];
    },
    set(value) {
      this.setDataValue('antecedentsMedicaux', Array.isArray(value) ? value : []);
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
  groupeSanguin: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true
  },
  allergies: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },

  traitementEnCours: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  profession: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fumeur: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  remarques: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notesMedicales: {
    type: DataTypes.TEXT
  },
  ordonnances: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  hooks: {
    beforeValidate: (patient) => {
      if (!Array.isArray(patient.antecedentsMedicaux)) {
        patient.antecedentsMedicaux = [];
      }
    }
  },
  timestamps: true, // Ajoute createdAt et updatedAt
  tableName: 'Patients',
  indexes: [
    {
      unique: true,
      fields: ['numeroSecu']
    },
    {
      fields: ['dentisteId']
    }
  ]
});

module.exports = Patient;
