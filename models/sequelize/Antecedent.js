const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Antecedent = sequelize.define('Antecedent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'antecedentsMedicaux',
    timestamps: true
  });

  return Antecedent;
};
