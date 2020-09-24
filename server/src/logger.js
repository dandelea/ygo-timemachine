const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: process.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf((info) => {
      let splat = ' ';
      if (info.splat !== undefined) {
        splat = info.splat;
      }
      return `${info.timestamp} ${info.level}: ${info.message}${splat}`;
    }),
    winston.format.colorize(),
  ),
  handleExceptions: true,
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.DailyRotateFile({
      level: 'error',
      dirname: 'logs',
      filename: 'error-%DATE%.log',
      datePattern: 'YYYYMMDD',
      zippedArchive: true,
      maxSize: '5m',
      maxFiles: '7d',
    }),
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYYMMDD',
      zippedArchive: true,
      maxSize: '5m',
      maxFiles: '7d',
    }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
