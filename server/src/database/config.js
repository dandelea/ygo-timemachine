const logger = require('../logger');

module.exports = {
  development: {
    username: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST || '127.0.0.1',
    port: process.env.PGPORT || 5432,
    dialect: 'postgres',
    logging: true,
  },
  test: {
    storage: ':memory',
    dialect: 'sqlite',
    logging: (msg) => logger.debug(msg),
  },
  production: {
    username: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST || '127.0.0.1',
    port: process.env.PGPORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
  },
};
