'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('historiques', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Patients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date_heure: {
        type: Sequelize.DATE,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      statut: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('historiques');
  }
}; 