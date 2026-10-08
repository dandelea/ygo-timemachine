import type { ErrorRequestHandler, RequestHandler } from 'express'
import { z } from 'zod'

export class HttpError extends Error {
  override name = 'HttpError'
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const notFound = (message = 'Not found') => new HttpError(404, message)
export const badRequest = (message: string) => new HttpError(400, message)

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(notFound())
}

/** Maps errors to a JSON body without leaking internal details. */
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      error: 'Invalid request',
      issues: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
    })
    return
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message })
    return
  }
  // body-parser errors (malformed JSON, payload too large) carry a status.
  if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
    const status = error.status >= 400 && error.status < 500 ? error.status : 500
    res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message })
    return
  }
  req.log.error({ err: error }, 'Unhandled request error')
  res.status(500).json({ error: 'Internal server error' })
}
