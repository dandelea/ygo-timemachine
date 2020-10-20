module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cards_images', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      card_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      image_small: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('cards_images');
  },
};
