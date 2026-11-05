import { DataTypes, type ModelAttributes, type QueryInterface, type Transaction } from 'sequelize'

// Card printings (sets and rarities), Link and Pendulum values, and the cards
// and limits of the GOAT and Edison formats. Tables and columns that already
// exist are left untouched, like in the initial migration, so a database
// created with sequelize.sync() is adopted as it is.

const columns: [table: string, column: string, type: ModelAttributes[string]][] = [
  ['cards', 'link_value', DataTypes.INTEGER],
  ['cards', 'link_markers', DataTypes.STRING],
  ['cards', 'pendulum_scale', DataTypes.INTEGER],
  ['decks', 'format', DataTypes.STRING],
]

const cardReference = {
  type: DataTypes.BIGINT,
  references: { model: 'cards', key: 'id' },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
}

const tables: [string, ModelAttributes][] = [
  [
    'sets',
    {
      name: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      code: DataTypes.STRING,
      release_date: DataTypes.DATEONLY,
    },
  ],
  [
    'cards_printings',
    {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      set_name: DataTypes.STRING,
      set_code: DataTypes.STRING,
      rarity: DataTypes.STRING,
      card_id: cardReference,
    },
  ],
  [
    'formats_cards',
    {
      id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      format: { type: DataTypes.STRING, allowNull: false },
      max_copies: { type: DataTypes.INTEGER, allowNull: false },
      card_id: cardReference,
    },
  ],
]

const indexes: [table: string, fields: string[]][] = [
  ['cards_printings', ['card_id']],
  ['formats_cards', ['format', 'card_id']],
]

export async function up(queryInterface: QueryInterface, transaction: Transaction) {
  for (const [table, column, type] of columns) {
    // The options type omits `transaction`, but describeTable passes it to the query.
    const existing = await queryInterface.describeTable(table, { transaction } as never)
    if (!(column in existing)) {
      await queryInterface.addColumn(table, column, type as never, { transaction })
    }
  }
  for (const [table, attributes] of tables) {
    if (!(await queryInterface.tableExists(table, { transaction }))) {
      await queryInterface.createTable(table, attributes, { transaction })
    }
  }
  for (const [table, fields] of indexes) {
    const name = `${table}_${fields.join('_')}`
    const existing = (await queryInterface.showIndex(table, { transaction })) as { name: string }[]
    if (!existing.some((index) => index.name === name)) {
      await queryInterface.addIndex(table, fields, { name, transaction })
    }
  }
}
