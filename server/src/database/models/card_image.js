const { Model, DataTypes } = require('sequelize');
const sequelize = require('../index');

class CardImage extends Model { }

CardImage.init({
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  image: DataTypes.STRING,
  image_small: DataTypes.STRING,
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
  modelName: 'cards_images',
  timestamps: false,
});

module.exports = CardImage;
