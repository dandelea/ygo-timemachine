const { version } = require('../../package.json');
const CardService = require('../services/cards');

exports.ping = (req, res) => {
  res.send('pong');
};

exports.version = (req, res) => {
  res.send(version);
};

exports.dbStats = async (req, res) => {
  res.send({
    pageSize: CardService.PAGE_SIZE,
    cards: await CardService.countAll(),
  });
};
