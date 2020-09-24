const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');

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

cache.redis.on('connect', () => {
  app.listen(port, () => {
    logger.info(`Web server listening on port ${port} and ${process.env.NODE_ENV} environment.`);
    app.emit('started');
  });
});
