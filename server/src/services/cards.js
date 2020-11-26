const md5 = require('md5');
const { Op, Sequelize } = require('sequelize');
const cache = require('../cache');
const Archetype = require('../database/models/archetype');
const Card = require('../database/models/card');
const CARDTYPES = require('../../data/card-types.json');

const CardImage = require('../database/models/card_image');

exports.PAGE_SIZE = 36;

exports.getCards = async (form) => {
  const cacheKey = md5(JSON.stringify(form));
  let result = await cache.get(cacheKey);
  if (result) {
    return result;
  }
  let where = {};
  if (form.search) {
    where.name = {
      [Op.or]: [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('name')),
          { [Op.like]: `%${form.search.toLowerCase()}%` },
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('description')),
          { [Op.like]: `%${form.search.toLowerCase()}%` },
        ),
      ],
    };
  }
  where.subtype = {
    [Op.in]: [].concat(...form.checks.map((x) => CARDTYPES[x])),
  };
  if (form.archetypes.length) {
    where.archetype_id = {
      [Op.in]: form.archetypes,
    };
  }

  if (form.checks.includes('MONSTER') || form.checks.includes('SPELL') || form.checks.includes('TRAP')) {
    let races = [];
    if (form.checks.includes('MONSTER')) {
      where = {
        ...where,
        attribute: {
          [Op.or]: [
            {
              [Op.in]: form.attributes,
            },
            {
              [Op.eq]: null,
            },
          ],
        },
        level: {
          [Op.or]: [
            {
              [Op.in]: form.levels.map((x) => parseInt(x, 10)),
            },
            {
              [Op.eq]: null,
            },
          ],
        },
        atk: {
          [Op.or]: [
            {
              [Op.between]: [form.attack.min, form.attack.max],
            },
            {
              [Op.eq]: null,
            },
          ],
        },
        def: {
          [Op.or]: [
            {
              [Op.between]: [form.defense.min, form.defense.max],
            },
            {
              [Op.eq]: null,
            },
          ],
        },
      };
      races = [...form.monsterTypes];
    }
    if (form.checks.includes('SPELL')) {
      races = [...races, ...form.spellFamilies];
    }
    if (form.checks.includes('TRAP')) {
      races = [...races, ...form.trapFamilies];
    }
    where.race = {
      [Op.in]: races,
    };
  }

  if (form.epoch) {
    where.first_release = {
      [Op.lte]: form.epoch,
    };
  }

  const order = [
    [form.order.field, form.order.inverse ? 'DESC' : 'ASC'],
  ];

  const count = await Card.count({
    where,
  });

  result = await Card.findAll({
    where,
    order,
    limit: exports.PAGE_SIZE,
    include: [
      {
        model: CardImage,
        as: 'images',
      },
    ],
  });

  result = {
    total: count,
    data: result,
  };
  await cache.set(cacheKey, result);
  return result;
};

exports.getCard = async (id) => {
  const result = await Card.findByPk(id, {
    include: {
      model: Archetype,
      as: 'archetype',
    },
  });
  return result;
};

exports.countAll = async () => {
  const result = await Card.count();
  return result;
};
