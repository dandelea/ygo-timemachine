module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('archetypes', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('archetypes');
  },
};
