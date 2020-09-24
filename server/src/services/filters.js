const moment = require('moment');
const sets = require('../../data/sets.json');

exports.filterChecks = (cardType, checks) => {
  const result = [];
  if (checks.monsters) {
    result.push(
      'Effect Monster',
      'Flip Effect Monster',
      'Flip Tuner Effect Monster',
      'Gemini Monster',
      'Normal Monster',
      'Normal Tuner Monster',
      'Pendulum Effect Monster',
      'Pendulum Flip Effect Monster',
      'Pendulum Normal Monster',
      'Pendulum Tuner Effect Monster',
      'Ritual Effect Monster',
      'Ritual Monster',
      'Spirit Monster',
      'Toon Monster',
      'Tuner Monster',
      'Union Effect Monster',
    );
  }
  if (checks.spells) {
    result.push(
      'Spell Card',
    );
  }
  if (checks.traps) {
    result.push(
      'Trap Card',
    );
  }
  if (checks.extra) {
    result.push(
      'Fusion Monster',
      'Link Monster',
      'Pendulum Effect Fusion Monster',
      'Synchro Monster',
      'Synchro Pendulum Effect Monster',
      'Synchro Tuner Monster',
      'XYZ Monster',
      'XYZ Pendulum Effect Monster',
    );
  }
  return !result.length || result.includes(cardType);
};

exports.filterAttributes = (cardAttribute, attributes) => {
  const attributeArray = [];
  Object.keys(attributes).forEach((attribute) => {
    if (attributes[attribute]) {
      attributeArray.push(attribute.toUpperCase());
    }
  });
  return cardAttribute === undefined
    || !attributeArray.length
    || attributeArray.includes(cardAttribute);
};

exports.filterStars = (cardStars, stars) => {
  const starsArray = [];
  Object.keys(stars).forEach((star) => {
    if (stars[star]) {
      starsArray.push(parseInt(star, 10));
    }
  });
  return cardStars === undefined
    || !starsArray.length
    || starsArray.includes(cardStars);
};

exports.filterAttackDefense = (cardAttack, min, max) => cardAttack === undefined
  || (
    min <= cardAttack && max >= cardAttack
  );

exports.filterMonsterTypes = (cardType, cardRace, form) => {
  const typesArray = [];
  Object.keys(form).forEach((type) => {
    if (form[type]) {
      typesArray.push(type.toLowerCase());
    }
  });
  if ([
    'Effect Monster',
    'Flip Effect Monster',
    'Flip Tuner Effect Monster',
    'Gemini Monster',
    'Normal Monster',
    'Normal Tuner Monster',
    'Pendulum Effect Monster',
    'Pendulum Flip Effect Monster',
    'Pendulum Normal Monster',
    'Pendulum Tuner Effect Monster',
    'Ritual Effect Monster',
    'Ritual Monster',
    'Spirit Monster',
    'Toon Monster',
    'Tuner Monster',
    'Union Effect Monster',

    'Fusion Monster',
    'Link Monster',
    'Pendulum Effect Fusion Monster',
    'Synchro Monster',
    'Synchro Pendulum Effect Monster',
    'Synchro Tuner Monster',
    'XYZ Monster',
    'XYZ Pendulum Effect Monster',
  ].includes(cardType)) {
    cardRace = cardRace.toLowerCase();
  } else {
    cardRace = undefined;
  }
  return cardType === undefined
    || !typesArray.length
    || typesArray.includes(cardRace);
};

exports.filterArchetypes = (cardArchetype, selectedArchetypes) => !selectedArchetypes.length
  || selectedArchetypes.includes(cardArchetype);

exports.filterSearch = (card, searchQuery) => card.name.toLowerCase().includes(searchQuery);

exports.filterSpellFamilies = (cardType, cardRace, form) => {
  let result = true;
  const typesArray = [];
  Object.keys(form).forEach((type) => {
    if (form[type]) {
      typesArray.push(type.toLowerCase());
    }
  });

  if ([
    'Spell Card',
  ].includes(cardType)) {
    result = typesArray.includes(cardRace.toLowerCase())
      || !typesArray.length;
  }

  return result;
};

exports.filterTrapFamilies = (cardType, cardRace, form) => {
  let result = true;
  const typesArray = [];
  Object.keys(form).forEach((type) => {
    if (form[type]) {
      typesArray.push(type.toLowerCase());
    }
  });
  if ([
    'Trap Card',
  ].includes(cardType)) {
    result = typesArray.includes(cardRace.toLowerCase())
      || !typesArray.length;
  }

  return result;
};

exports.filterEpoch = (card, epoch) => {
  const firstRelease = (cardo) => {
    let firstDate = null;
    if (!cardo.card_sets) return null;
    cardo.card_sets.forEach((cardSetLink) => {
      const setCode = cardSetLink.set_code.split('-')[0];
      const set = sets.find((x) => x.set_code === setCode);
      if (set) {
        if (firstDate === null) {
          firstDate = set.tcg_date;
        } else if (new Date(set.tcg_date) - new Date(firstDate) < 0) {
          firstDate = set.tcg_date;
        }
      }
    });
    return firstDate;
  };
  const date = firstRelease(card);
  return date !== null
    && moment(date, 'YYYY-MM-DD').isBefore(moment(epoch, 'YYYY-MM-DD'));
};
