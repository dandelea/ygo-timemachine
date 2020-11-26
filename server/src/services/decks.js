const Card = require('../database/models/card');
const CardImage = require('../database/models/card_image');
const Deck = require('../database/models/deck');
const DeckCard = require('../database/models/deck_card');

exports.getDecks = async () => {
  const decks = await Deck.findAll({
    include: [
      {
        model: Card,
        as: 'cards',
        include: [
          {
            model: CardImage,
            as: 'images',
            attributes: ['image', 'image_small'],
          },
        ],
        attributes: ['id'],
      },
    ],
  });
  return decks;
};

exports.getDeck = async (id) => {
  const deck = await Deck.findOne({
    where: {
      id,
    },
    include: [
      {
        model: DeckCard,
        as: 'decks_cards',
        include: {
          model: Card,
          as: 'card',
          include: {
            model: CardImage,
            as: 'images',
          },
        },
        attributes: ['id'],
      },
    ],
  });
  let result = deck;
  if (result) {
    result = deck.toJSON();
    result.decks_cards = result.decks_cards.map((x) => x.card);
    result.main = result.decks_cards.filter((x) => ['MONSTER', 'SPELL', 'TRAP'].includes(x.type)).sort((a, b) => ((a.type > b.type) ? 1 : -1));
    result.extra = result.decks_cards.filter((x) => ['EXTRA'].includes(x.type));
    delete result.decks_cards;
  }
  return result;
};

exports.upsertDeck = async (id, body) => {
  let deck = await Deck.findByPk(id);
  if (deck) {
    deck = await deck.update({
      id: deck.id,
      name: body.name,
      color: body.color,
    });
    await DeckCard.destroy({
      where: {
        deck_id: id,
      },
    });
  } else {
    deck = await Deck.create({
      name: body.name,
      color: body.color,
    });
  }
  await DeckCard.bulkCreate(body.cards.map((cardId) => ({
    deck_id: deck.id,
    card_id: cardId,
  })));

  const result = await Deck.findOne({
    where: {
      id: deck.id,
    },
  });
  return result;
};
