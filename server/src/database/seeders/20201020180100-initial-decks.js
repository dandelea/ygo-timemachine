const DECKS = require('../../../data/decks.json');
const sequelize = require('../index');
require('../associations');
const async = require('../../services/async');

const Deck = require('../models/deck');

module.exports = {
  up: async () => {
    await sequelize.sync({ force: false });
    await async.forEach(DECKS, async (deck) => {
      const deckobj = await Deck.create(deck);
      await deckobj.setCards(deck.cards);
    });
  },

  down: async (queryInterface) => {
    await sequelize.sync({ force: false });
    await queryInterface.bulkDelete('decks', null, {});
  },
};
