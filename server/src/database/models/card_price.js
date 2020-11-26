const { Model, DataTypes } = require('sequelize');
const sequelize = require('../index');

class CardPrice extends Model { }

CardPrice.init({
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  value: DataTypes.FLOAT,
  shop: DataTypes.STRING,
  date: DataTypes.DATE,
  card_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'cards',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  sequelize,
  modelName: 'cards_prices',
  timestamps: false,
});

module.exports = CardPrice;
