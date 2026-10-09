import { describe, expect, it } from 'vitest'
import { createRedisCache } from '../src/cache.ts'
import { ConfigError, loadConfig } from '../src/config.ts'
import { cardTypeOf } from '../src/domain/card-types.ts'
import { currentImageUrl } from '../src/domain/images.ts'

describe('loadConfig', () => {
  it('uses SQLite and local CORS origins by default in development', () => {
    const config = loadConfig({})
    expect(config).toMatchObject({
      env: 'development',
      port: 5000,
      logLevel: 'debug',
      database: { dialect: 'sqlite', storage: 'db/dev.sqlite' },
      redisUrl: undefined,
      corsOrigins: ['http://localhost:3000'],
    })
  })

  it('uses PostgreSQL and no CORS origins by default in production', () => {
    const config = loadConfig({ NODE_ENV: 'production', PGHOST: 'db', PGPASSWORD: 'pw' })
    expect(config).toMatchObject({
      logLevel: 'info',
      database: { dialect: 'postgres', host: 'db', port: 5432, password: 'pw' },
      corsOrigins: [],
    })
  })

  it('builds the Redis URL from host and port and parses CORS origins', () => {
    const config = loadConfig({
      REDIS_HOST: 'redis',
      CORS_ORIGINS: 'https://a.example, https://b.example',
    })
    expect(config.redisUrl).toBe('redis://redis:6379')
    expect(config.corsOrigins).toEqual(['https://a.example', 'https://b.example'])
  })

  it('reports every invalid variable', () => {
    expect(() => loadConfig({ PORT: 'eighty', CORS_ORIGINS: 'not a url' })).toThrow(ConfigError)
    expect(() => loadConfig({ PORT: 'eighty' })).toThrow(/PORT/)
  })
})

describe('currentImageUrl', () => {
  it('rewrites retired image URLs to the current host', () => {
    expect(
      currentImageUrl('https://storage.googleapis.com/ygoprodeck.com/pics/123.jpg', 'large'),
    ).toBe('https://images.ygoprodeck.com/images/cards/123.jpg')
    expect(
      currentImageUrl('https://storage.googleapis.com/ygoprodeck.com/pics_small/123.jpg', 'small'),
    ).toBe('https://images.ygoprodeck.com/images/cards_small/123.jpg')
  })

  it('leaves unknown URLs and nulls untouched', () => {
    expect(currentImageUrl('https://example.com/a.png', 'large')).toBe('https://example.com/a.png')
    expect(currentImageUrl(null, 'small')).toBeNull()
  })
})

describe('cardTypeOf', () => {
  it('groups subtypes into card types', () => {
    expect(cardTypeOf('Effect Monster')).toBe('MONSTER')
    expect(cardTypeOf('Link Monster')).toBe('EXTRA')
    expect(cardTypeOf('Trap Card')).toBe('TRAP')
    expect(cardTypeOf('Skill Card')).toBeNull()
    expect(cardTypeOf(null)).toBeNull()
  })
})

describe('createRedisCache', () => {
  it('degrades to cache misses when Redis is unreachable', async () => {
    const cache = createRedisCache('redis://127.0.0.1:1')
    await expect(cache.get('key')).resolves.toBeNull()
    await expect(cache.set('key', { value: 1 })).resolves.toBeUndefined()
    await cache.close()
  })
})
