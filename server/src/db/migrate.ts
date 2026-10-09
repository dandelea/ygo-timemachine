import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DataTypes, Transaction, type QueryInterface } from 'sequelize'
import { config } from '../config.ts'
import { logger } from '../logger.ts'
import * as initialSchema from './migrations/0001-initial-schema.ts'
import { sequelize } from './sequelize.ts'

interface Migration {
  name: string
  up(queryInterface: QueryInterface, transaction: Transaction): Promise<void>
}

/**
 * Every schema change, in order. Append new migrations at the end and never
 * edit one that has already been released: databases record which ones ran.
 */
export const migrations: Migration[] = [{ name: '0001-initial-schema', ...initialSchema }]

// Same table and column as sequelize-cli and Umzug, so either can take over.
const AppliedMigration = sequelize.define(
  'AppliedMigration',
  { name: { type: DataTypes.STRING, allowNull: false, primaryKey: true } },
  { tableName: 'SequelizeMeta', timestamps: false },
)

/** Applies pending migrations, each in its own transaction. Returns their names. */
export async function migrateDatabase(): Promise<string[]> {
  if (config.database.dialect === 'sqlite' && config.database.storage !== ':memory:') {
    mkdirSync(path.dirname(path.resolve(config.database.storage)), { recursive: true })
  }
  await AppliedMigration.sync()
  const applied = new Set(
    (await AppliedMigration.findAll()).map((row) => row.get('name') as string),
  )
  const pending = migrations.filter((migration) => !applied.has(migration.name))

  const appliedNow: string[] = []
  for (const migration of pending) {
    // Another process (the seed script and the API, say) may be migrating the
    // same database: SQLite takes the write lock up front (IMMEDIATE) and the
    // migration is skipped if it was applied while this one waited.
    await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async (transaction) => {
      if (await AppliedMigration.findByPk(migration.name, { transaction })) return
      await migration.up(sequelize.getQueryInterface(), transaction)
      await AppliedMigration.create({ name: migration.name }, { transaction })
      appliedNow.push(migration.name)
      logger.info({ migration: migration.name }, 'Migration applied')
    })
  }
  return appliedNow
}
