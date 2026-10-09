import express from 'express'
import { createApp } from './app.ts'
import { createRedisCache, noopCache } from './cache.ts'
import { config } from './config.ts'

// Entry point for serverless hosting (Vercel), where the API is served under
// /api of the same domain as the client, as the nginx gateway does. The schema
// is migrated and seeded ahead of time with `npm run seed`, not on cold starts.
const app = express()
app.disable('x-powered-by')
app.use(
  '/api',
  createApp({
    cache: config.redisUrl ? createRedisCache(config.redisUrl) : noopCache,
    corsOrigins: config.corsOrigins,
  }),
)

export default app
