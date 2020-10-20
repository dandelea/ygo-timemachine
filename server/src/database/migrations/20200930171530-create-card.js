module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cards', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      subtype: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      race: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      atk: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      def: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      attribute: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      archetype_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('cards');
  },
};
