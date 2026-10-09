import { createApp } from './app.ts'
import { createRedisCache, noopCache } from './cache.ts'
import { config } from './config.ts'
import { migrateDatabase } from './db/migrate.ts'
import { sequelize } from './db/sequelize.ts'
import { logger } from './logger.ts'

await migrateDatabase()
logger.info({ dialect: config.database.dialect }, 'Database ready')

const cache = config.redisUrl ? createRedisCache(config.redisUrl) : noopCache
if (!config.redisUrl) logger.info('Redis not configured; card searches are not cached')

const server = createApp({ cache, corsOrigins: config.corsOrigins }).listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, 'API listening')
})

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down')
  server.close()
  await Promise.allSettled([cache.close(), sequelize.close()])
}

process.once('SIGTERM', (signal) => void shutdown(signal))
process.once('SIGINT', (signal) => void shutdown(signal))
