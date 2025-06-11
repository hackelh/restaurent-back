'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Mettre à jour les enregistrements existants avec un dentisteId par défaut (1)
    // Remarque : Vous devrez peut-être adapter cette valeur par défaut selon votre cas d'utilisation
    await queryInterface.sequelize.query(
      `UPDATE ordonnances SET dentisteId = 1 WHERE dentisteId IS NULL`,
      { type: Sequelize.QueryTypes.UPDATE }
    );

    // Modifier la colonne pour la rendre non nullable
    await queryInterface.changeColumn('ordonnances', 'dentisteId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revenir à la configuration précédente
    await queryInterface.changeColumn('ordonnances', 'dentisteId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};
