const { Model, DataTypes } = require('sequelize');
const sequelize = require('../index');

class DeckCard extends Model { }

DeckCard.init({
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  card_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'cards',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  deck_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'decks',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  sequelize,
  modelName: 'decks_cards',
  timestamps: false,
});

module.exports = DeckCard;
