import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApp } from './app.ts'
import { createRedisCache, noopCache } from './cache.ts'
import { config } from './config.ts'

// Entry point for serverless hosting (Vercel), where the API runs as one
// function behind /api. The schema is migrated and seeded ahead of time with
// `npm run seed`, not on each cold start.
const app = createApp({
  cache: config.redisUrl ? createRedisCache(config.redisUrl) : noopCache,
  corsOrigins: config.corsOrigins,
})

/** Serves an API request, removing the /api prefix as the nginx gateway does. */
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ?? '/'
  req.url = /^\/api(?=[/?]|$)/.test(url) ? url.slice('/api'.length) || '/' : url
  if (req.url.startsWith('?')) req.url = `/${req.url}`
  app(req, res)
}
