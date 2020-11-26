/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */

const { Model, DataTypes } = require('sequelize');
const { v4: uuid } = require('uuid');
const sequelize = require('../index');

class Deck extends Model { }

Deck.init({
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  color: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'decks',
});

Deck.beforeBulkCreate((decks) => decks.map((deck) => deck.id = uuid()));

Deck.beforeCreate((deck) => deck.id = uuid());

module.exports = Deck;
