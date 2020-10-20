const logger = require('../logger');
const CardService = require('../services/cards');

exports.cards = (req, res) => {
  CardService.getCards(req.body).then((value) => {
    res.send(value);
  }).catch((err) => {
    logger.error(err);
    res.sendStatus(500);
  });
};

exports.card = (req, res) => {
  CardService.getCard(req.params.id).then((card) => {
    if (card) {
      res.send(card);
    } else {
      res.sendStatus(404);
    }
  }).catch((err) => {
    logger.error(err);
    res.sendStatus(500);
  });
};
