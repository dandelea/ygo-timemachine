const moment = require('moment');
const CARDS = require('../../../data/cards.json').filter((x) => x.card_sets).filter((x) => x.type !== 'Skill Card');
const SETS = require('../../../data/sets.json');
const async = require('../../services/async');

const logger = require('../../logger');

const sequelize = require('../index');
require('../associations');

const Archetype = require('../models/archetype');
const Card = require('../models/card');

module.exports = {
  up: async () => {
    await sequelize.sync({ force: false });
    logger.info('Starting database seed!');
    const NOW = moment().toDate();
    await Archetype.bulkCreate(
      CARDS.map((x) => x.archetype)
        .filter((x) => x)
        .filter((value, index, self) => index === self.indexOf(value))
        .map((x) => ({
          id: x,
        })),
    );
    const cards = await async.map(CARDS, async (card) => {
      const firstRelease = SETS
        .filter((x) => card.card_sets.map((y) => y.set_name)
          .includes(x.set_name))
        .map((x) => x.tcg_date)
        .sort()[0];
      return {
        id: card.id,
        name: card.name,
        description: card.desc,
        subtype: card.type,
        race: card.race,
        atk: card.atk,
        def: card.def,
        level: card.level,
        attribute: card.attribute,
        first_release: firstRelease,
        images: card.card_images.map((cardImage) => ({
          image: cardImage.image_url,
          image_small: cardImage.image_url_small,
        })),
        prices: Object.keys(card.card_prices[0]).map((shop) => ({
          value: parseFloat(card.card_prices[0][shop]),
          shop: shop.replace('_price', ''),
          date: NOW,
        })),
        archetype_id: card.archetype,
      };
    });
    await Card.bulkCreate(cards, {
      include: [
        {
          association: Card.associations.images,
        },
        {
          association: Card.associations.prices,
        },
      ],
    });
  },

  down: async (queryInterface) => {
    await sequelize.sync({ force: false });
    logger.info('Deleting database seed!');
    await queryInterface.bulkDelete('archetypes', null, {});
    await queryInterface.bulkDelete('cards', null, {});
    await queryInterface.bulkDelete('cards_images', null, {});
    await queryInterface.bulkDelete('cards_prices', null, {});
  },
};
