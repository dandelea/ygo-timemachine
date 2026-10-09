import { z } from 'zod'

const nodeEnv = z.enum(['development', 'test', 'production']).default('development')

const commaSeparated = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()))

const envSchema = z.object({
  NODE_ENV: nodeEnv,
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  DB_DIALECT: z.enum(['sqlite', 'postgres']).optional(),
  SQLITE_STORAGE: z.string().min(1).optional(),
  PGHOST: z.string().min(1).default('localhost'),
  PGPORT: z.coerce.number().int().min(1).max(65535).default(5432),
  PGUSER: z.string().min(1).default('postgres'),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().min(1).default('postgres'),
  REDIS_URL: z.url().optional(),
  REDIS_HOST: z.string().min(1).optional(),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  CORS_ORIGINS: commaSeparated.optional(),
})

export type DatabaseConfig =
  | { dialect: 'sqlite'; storage: string }
  | {
      dialect: 'postgres'
      host: string
      port: number
      username: string
      password: string | undefined
      database: string
    }

export interface Config {
  env: 'development' | 'test' | 'production'
  port: number
  logLevel: string
  database: DatabaseConfig
  redisUrl: string | undefined
  corsOrigins: string[]
}

const defaultLogLevel = { development: 'debug', test: 'silent', production: 'info' } as const
const defaultCorsOrigins = {
  development: ['http://localhost:3000'],
  test: [],
  production: [],
}

export class ConfigError extends Error {
  override name = 'ConfigError'
}

/** Parses and validates the environment, failing fast with a readable message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new ConfigError(`Invalid environment configuration:\n${details}`)
  }
  const values = parsed.data
  const dialect = values.DB_DIALECT ?? (values.NODE_ENV === 'production' ? 'postgres' : 'sqlite')

  const database: DatabaseConfig =
    dialect === 'sqlite'
      ? {
          dialect,
          storage:
            values.SQLITE_STORAGE ?? (values.NODE_ENV === 'test' ? ':memory:' : 'db/dev.sqlite'),
        }
      : {
          dialect,
          host: values.PGHOST,
          port: values.PGPORT,
          username: values.PGUSER,
          password: values.PGPASSWORD,
          database: values.PGDATABASE,
        }

  const redisUrl =
    values.REDIS_URL ??
    (values.REDIS_HOST ? `redis://${values.REDIS_HOST}:${values.REDIS_PORT}` : undefined)

  return {
    env: values.NODE_ENV,
    port: values.PORT,
    logLevel: values.LOG_LEVEL ?? defaultLogLevel[values.NODE_ENV],
    database,
    redisUrl,
    corsOrigins: values.CORS_ORIGINS ?? defaultCorsOrigins[values.NODE_ENV],
  }
}

export const config = loadConfig()
