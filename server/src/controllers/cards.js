const md5 = require('md5');
const cards = require('../../data/cards.json');
const cache = require('../cache');
const filters = require('../services/filters');

exports.PAGE_SIZE = 60;

exports.cards = (req, res) => {
  const cacheKey = md5(JSON.stringify(req.body));
  cache.get(cacheKey, (value) => {
    if (value) {
      res.send(value);
    } else {
      let result = cards;
      if (req.body.search) {
        result = result.filter((card) => filters.filterSearch(card, req.body.search));
      }
      const noChecks = Object.keys(req.body.checks).filter((x) => req.body.checks[x]).length === 0;
      result = result.filter((card) => filters.filterChecks(card.type, req.body.checks));
      if (req.body.checks.monsters || noChecks) {
        result = result.filter((card) => filters.filterAttributes(card.attribute, req.body.attributes));
        result = result.filter((card) => filters.filterStars(card.level, req.body.levels));
        result = result.filter((card) => filters.filterAttackDefense(card.atk, req.body.attack.min, req.body.attack.max));
        result = result.filter((card) => filters.filterAttackDefense(card.def, req.body.defense.min, req.body.defense.max));
        result = result.filter((card) => filters.filterMonsterTypes(card.type, card.race, req.body.monsterTypes));
        result = result.filter((card) => filters.filterArchetypes(card.archetype, req.body.archetypes));
      }
      if (req.body.checks.spells || noChecks) {
        result = result.filter((card) => filters.filterSpellFamilies(card.type, card.race, req.body.spellFamilies));
      }
      if (req.body.checks.traps || noChecks) {
        result = result.filter((card) => filters.filterTrapFamilies(card.type, card.race, req.body.trapFamilies));
      }
      if (req.body.epoch) {
        result = result.filter((card) => filters.filterEpoch(card, req.body.epoch));
      }

      if (req.body.order.inverse || req.body.order.field !== 'name') {
        result.sort((a, b) => {
          const a_f = a[req.body.order.field];
          const b_f = b[req.body.order.field];
          // equal items sort equally
          if (a_f === b_f) {
            return 0;
          }
          // nulls sort after anything else
          if (a_f === undefined) {
            return 1;
          }
          if (b_f === undefined) {
            return -1;
          }
          // otherwise, if we're ascending, lowest sorts first
          if (!req.body.order.inverse) {
            return a_f < b_f ? -1 : 1;
          }
          // if descending, highest sorts first

          return a_f < b_f ? 1 : -1;
        });
      }

      result = {
        total: result.length,
        data: result = result.slice(0, exports.PAGE_SIZE),
      };
      cache.set(cacheKey, result);
      res.send(result);
    }
  });
};

exports.card = async (req, res) => {
  cache.get(req.params.id, (value) => {
    let result;

    if (value) {
      result = value;
    } else {
      result = cards.find((card) => card.id == req.params.id);
      cache.set(req.params.id, result);
    }

    if (result) {
      res.send(result);
    } else {
      res.sendStatus(404);
    }
  });
};
