import { beforeEach, describe, expect, it } from 'vitest'
import { migrateDatabase, migrations } from '../src/db/migrate.ts'
import { Deck } from '../src/db/models.ts'
import { sequelize } from '../src/db/sequelize.ts'

const queryInterface = sequelize.getQueryInterface()

/** Columns and foreign keys of every application table. */
async function schema() {
  const tables = (await queryInterface.showAllTables())
    .filter((table) => table !== 'SequelizeMeta')
    .sort()
  return Promise.all(
    tables.map(async (table) => ({
      table,
      columns: await queryInterface.describeTable(table),
      foreignKeys: await queryInterface.getForeignKeyReferencesForTable(table),
    })),
  )
}

const appliedMigrations = async () =>
  (
    await sequelize.query(
      `SELECT name FROM ${queryInterface.quoteIdentifier('SequelizeMeta')} ORDER BY name`,
    )
  )[0]

beforeEach(() => queryInterface.dropAllTables())

describe('migrations', () => {
  it('create the same schema as the models', async () => {
    await sequelize.sync()
    const fromModels = await schema()
    await queryInterface.dropAllTables()

    await migrateDatabase()
    expect(await schema()).toEqual(fromModels)
  })

  it('run once and record what they applied', async () => {
    expect(await migrateDatabase()).toEqual(migrations.map((migration) => migration.name))
    expect(await migrateDatabase()).toEqual([])
    expect(await appliedMigrations()).toEqual(
      migrations.map((migration) => ({ name: migration.name })),
    )
  })

  it('adopt a database created by the original application, keeping its data', async () => {
    await sequelize.sync()
    await Deck.create({ name: 'Legacy', color: 'red-500' })

    expect(await migrateDatabase()).toEqual(['0001-initial-schema'])
    expect(await Deck.count()).toBe(1)
  })
})
