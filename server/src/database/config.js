const path = require('path');
const logger = require('../logger');

module.exports = {
  development: {
    storage: path.join(__dirname, '..', '..', 'development.sqlite'),
    dialect: 'sqlite',
    logging: true,
  },
  test: {
    storage: ':memory',
    dialect: 'sqlite',
    logging: (msg) => logger.debug(msg),
  },
  production: {
    storage: path.join(__dirname, '..', '..', 'production.sqlite'),
    dialect: 'sqlite',
    logging: (msg) => logger.debug(msg),
  },
};
