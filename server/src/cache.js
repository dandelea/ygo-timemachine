const redis = require('redis');
const config = require('./config');
const logger = require('./logger');

const redisClient = redis.createClient({
  host: config.redisHost,
  port: config.redisPort,
  retry_strategy: () => 1000,
});
exports.redis = redisClient;

exports.get = async (key, callback = (value) => {}) => {
  redisClient.get(key, (err, value) => {
    if (err) {
      logger.error(err);
    } else {
      callback(value);
    }
  });
};

exports.set = (key, value, callback = () => {}) => {
  redisClient.set(key, JSON.stringify(value), () => {
    logger.info(`Adding new entry "${key}"`);
    callback();
  });
};
