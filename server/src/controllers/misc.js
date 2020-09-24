const { version } = require('../../package.json');
const cards = require('../../data/cards.json');
const sets = require('../../data/sets.json');
const { PAGE_SIZE } = require('./cards');

exports.ping = (req, res) => {
  res.send('pong');
};

exports.version = (req, res) => {
  res.send(version);
};

exports.dbStats = (req, res) => {
  res.send({
    pageSize: PAGE_SIZE,
    cards: cards.length,
    sets: sets.length,
  });
};
