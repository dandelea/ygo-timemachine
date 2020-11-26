const logger = require('../logger');
const DeckService = require('../services/decks');

exports.getAll = (req, res) => {
  DeckService.getDecks().then((value) => {
    res.send(value);
  }).catch((err) => {
    logger.error(err);
    res.sendStatus(500);
  });
};

exports.get = (req, res) => {
  DeckService.getDeck(req.params.id).then((value) => {
    if (value) {
      res.send(value);
    } else {
      res.sendStatus(404);
    }
  }).catch((err) => {
    logger.error(err);
    res.sendStatus(500);
  });
};

exports.edit = (req, res) => {
  DeckService.upsertDeck(req.params.id, req.body).then((deck) => {
    res.send(deck);
  }).catch((err) => {
    logger.error(err);
    res.sendStatus(500);
  });
};
