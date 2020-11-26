const database = require('./database/config');

module.exports = {
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: process.env.REDIS_PORT || 6379,
  database,
};
