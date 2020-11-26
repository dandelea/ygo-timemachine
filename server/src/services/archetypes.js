const Archetype = require('../database/models/archetype');
const Card = require('../database/models/card');

exports.getAll = async () => {
  const result = await Archetype.findAll({
    include: {
      model: Card,
      as: 'cards',
    },
  });
  return result;
};
