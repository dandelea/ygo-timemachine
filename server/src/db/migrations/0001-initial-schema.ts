import { DataTypes, type ModelAttributes, type QueryInterface, type Transaction } from 'sequelize'

// Schema of the original application, which created its tables with
// sequelize.sync(). Tables that already exist are left untouched, so databases
// created that way are adopted as they are.
const tables: [string, ModelAttributes][] = [
  ['archetypes', { id: { type: DataTypes.STRING, allowNull: false, primaryKey: true } }],
  [
    'cards',
    {
      id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.TEXT,
      subtype: DataTypes.STRING,
      race: DataTypes.STRING,
      atk: DataTypes.INTEGER,
      def: DataTypes.INTEGER,
      level: DataTypes.INTEGER,
      attribute: DataTypes.STRING,
      first_release: DataTypes.DATEONLY,
      archetype_id: {
        type: DataTypes.STRING,
        references: { model: 'archetypes', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
    },
  ],
  [
    'cards_images',
    {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      image: DataTypes.STRING,
      image_small: DataTypes.STRING,
      card_id: {
        type: DataTypes.BIGINT,
        references: { model: 'cards', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
  ],
  [
    'cards_prices',
    {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      value: DataTypes.FLOAT,
      shop: DataTypes.STRING,
      date: DataTypes.DATE,
      card_id: {
        type: DataTypes.BIGINT,
        references: { model: 'cards', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
  ],
  [
    'decks',
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      color: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
  ],
  [
    'decks_cards',
    {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      card_id: {
        type: DataTypes.BIGINT,
        references: { model: 'cards', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      deck_id: {
        type: DataTypes.UUID,
        references: { model: 'decks', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
  ],
]

export async function up(queryInterface: QueryInterface, transaction: Transaction) {
  for (const [table, attributes] of tables) {
    if (!(await queryInterface.tableExists(table, { transaction }))) {
      await queryInterface.createTable(table, attributes, { transaction })
    }
  }
}
