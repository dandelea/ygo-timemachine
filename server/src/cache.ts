import { createClient } from 'redis'
import { logger } from './logger.ts'

export interface Cache {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  close(): Promise<void>
}

// Card data only changes when the database is re-seeded; a day bounds staleness.
const TTL_SECONDS = 24 * 60 * 60

/** Used when Redis is not configured: every lookup is a miss. */
export const noopCache: Cache = {
  get: () => Promise.resolve(null),
  set: () => Promise.resolve(),
  close: () => Promise.resolve(),
}

/**
 * Redis-backed cache that never fails a request: when Redis is unreachable,
 * reads miss and writes are skipped while the client keeps reconnecting.
 */
export function createRedisCache(url: string): Cache {
  const client = createClient({
    url,
    socket: { reconnectStrategy: (retries) => Math.min(retries * 500, 5000) },
  })
  let lastError = ''
  client.on('error', (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    if (message !== lastError) logger.warn({ err: error }, 'Redis unavailable; serving uncached')
    lastError = message
  })
  client.on('ready', () => {
    lastError = ''
    logger.info('Redis connected')
  })
  client.connect().catch(() => {
    // Initial connection failures are reported by the 'error' handler and retried.
  })

  return {
    async get<T>(key: string) {
      if (!client.isReady) return null
      try {
        const value = await client.get(key)
        return value === null ? null : (JSON.parse(value) as T)
      } catch (error) {
        logger.warn({ err: error, key }, 'Cache read failed')
        return null
      }
    },
    async set(key, value) {
      if (!client.isReady) return
      try {
        await client.set(key, JSON.stringify(value), {
          expiration: { type: 'EX', value: TTL_SECONDS },
        })
      } catch (error) {
        logger.warn({ err: error, key }, 'Cache write failed')
      }
    },
    async close() {
      if (client.isOpen) await client.close()
    },
  }
}
