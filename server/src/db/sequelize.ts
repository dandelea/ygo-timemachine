import pg from 'pg'
import { Sequelize, type Options } from 'sequelize'
import { config } from '../config.ts'
import { logger } from '../logger.ts'

const logging: Options['logging'] = (sql) => {
  logger.trace({ sql }, 'sql')
}

export const sequelize =
  config.database.dialect === 'sqlite'
    ? new Sequelize({
        dialect: 'sqlite',
        storage: config.database.storage,
        logging,
        // SQLite allows one writer at a time; wait for it instead of failing.
        retry: { match: [/SQLITE_BUSY/], max: 20, backoffBase: 100, backoffExponent: 1.1 },
      })
    : new Sequelize({
        dialect: 'postgres',
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.database,
        // Passed explicitly so serverless bundlers (Vercel) include the driver.
        dialectModule: pg,
        // Hosted PostgreSQL (Neon) only accepts encrypted connections.
        dialectOptions: config.database.ssl ? { ssl: { rejectUnauthorized: true } } : {},
        logging,
      })
