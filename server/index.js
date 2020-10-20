const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

const database = require('./src/database');
require('./src/database/associations');
const cache = require('./src/cache');
const config = require('./src/config');
const logger = require('./src/logger');
const router = require('./src/router');

const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(helmet());
app.disable('x-powered-by');
app.use(bodyParser.json());
app.use(router);

process.on('unhandledRejection', (reason, p) => {
  logger.error('exception occur');
  throw reason;
});

cache.redis.on('connect', () => {
  logger.info(`Redis connected on port ${config.redisPort} on host ${config.redisHost}.`);
  database.sync({ force: false }).then(() => {
    logger.info('Connected to database !!');
    app.listen(port, () => {
      logger.info(`Web server listening on port ${port} and ${process.env.NODE_ENV} environment.`);
      app.emit('started');
    });
  }).catch((error) => {
    logger.error('Unable to connect to the database:');
    logger.error(error.message);
  });
});
