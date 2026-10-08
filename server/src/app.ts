import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import type { Cache } from './cache.ts'
import { errorHandler, notFoundHandler } from './http/errors.ts'
import { logger } from './logger.ts'
import { createRouter } from './routes/index.ts'

export interface AppOptions {
  cache: Cache
  corsOrigins: string[]
}

export function createApp({ cache, corsOrigins }: AppOptions): Express {
  const app = express()
  app.disable('x-powered-by')
  app.use(pinoHttp({ logger }))
  app.use(helmet())
  // Only listed origins may call the API cross-origin; same-origin requests
  // through the nginx proxy carry no Origin header and are unaffected.
  app.use(cors({ origin: corsOrigins }))
  app.use(express.json({ limit: '100kb' }))
  app.use(createRouter(cache))
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
