module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cards_sets', {
      card_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      set_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      rarity: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('cards_sets');
  },
};
