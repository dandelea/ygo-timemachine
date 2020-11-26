const redis = require('async-redis');
const config = require('./config');
const logger = require('./logger');

const redisClient = redis.createClient({
  host: config.redisHost,
  port: config.redisPort,
  retry_strategy: () => 1000,
});
exports.redis = redisClient;

exports.get = async (key) => {
  let result = await redisClient.get(key);
  result = JSON.parse(result);
  return result;
};

exports.set = async (key, value) => {
  logger.info(`Adding new entry "${key}"`);
  await redisClient.set(key, JSON.stringify(value));
};

exports.clean = async () => {
  await redisClient.flushall();
};
