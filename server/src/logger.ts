import { pino } from 'pino'
import { config } from './config.ts'

/** Structured JSON logs to stdout; pretty-printed in development when available. */
export const logger = pino({
  level: config.logLevel,
  ...(config.env === 'development' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
})
