const Archetype = require('./models/archetype');
const Card = require('./models/card');
const CardImage = require('./models/card_image');
const CardPrice = require('./models/card_price');
const Deck = require('./models/deck');
const DeckCard = require('./models/deck_card');

// 1 : N // Archetype : Cards
Card.belongsTo(Archetype, { as: 'archetype', foreignKey: 'archetype_id' });
Archetype.hasMany(Card, { as: 'cards', foreignKey: 'archetype_id' });

// 1 : N // Card : Images
CardImage.belongsTo(Card, { as: 'card', foreignKey: 'card_id' });
Card.hasMany(CardImage, { as: 'images', foreignKey: 'card_id' });

// 1 : N // Card : Prices
CardPrice.belongsTo(Card, { as: 'card', foreignKey: 'card_id' });
Card.hasMany(CardPrice, { as: 'prices', foreignKey: 'card_id' });

// N : N // Card : Decks
Card.belongsToMany(Deck, { through: { model: DeckCard, unique: false }, foreignKey: 'card_id' });
Deck.belongsToMany(Card, { through: { model: DeckCard, unique: false }, foreignKey: 'deck_id' });
DeckCard.belongsTo(Card, { as: 'card', foreignKey: 'card_id' });
Card.hasMany(DeckCard, { as: 'decks_cards', foreignKey: 'card_id' });
DeckCard.belongsTo(Deck, { as: 'deck', foreignKey: 'deck_id' });
Deck.hasMany(DeckCard, { as: 'decks_cards', foreignKey: 'deck_id' });
