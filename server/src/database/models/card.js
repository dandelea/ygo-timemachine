const { Model, DataTypes } = require('sequelize');
const sequelize = require('../index');

const CARDTYPES = require('../../../data/card-types.json');

class Card extends Model { }
Card.init({
  id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  description: DataTypes.TEXT,
  type: {
    type: DataTypes.VIRTUAL(DataTypes.STRING, ['subtype']),
    get() {
      const subtype = this.getDataValue('subtype');
      if (CARDTYPES.MONSTER.includes(subtype)) {
        return 'MONSTER';
      }
      if (CARDTYPES.SPELL.includes(subtype)) {
        return 'SPELL';
      }
      if (CARDTYPES.TRAP.includes(subtype)) {
        return 'TRAP';
      }
      if (CARDTYPES.EXTRA.includes(subtype)) {
        return 'EXTRA';
      }
      return null;
    },
  },
  subtype: DataTypes.STRING,
  race: DataTypes.STRING,
  atk: DataTypes.INTEGER,
  def: DataTypes.INTEGER,
  level: DataTypes.INTEGER,
  attribute: DataTypes.STRING,
  first_release: DataTypes.DATEONLY,
  archetype_id: {
    type: DataTypes.STRING,
    references: {
      model: 'archetypes',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  sequelize,
  modelName: 'cards',
  timestamps: false,
});

module.exports = Card;
