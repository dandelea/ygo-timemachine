module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sets', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tcg_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('sets');
  },
};
