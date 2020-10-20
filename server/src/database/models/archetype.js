const { Model, DataTypes } = require('sequelize');
const sequelize = require('../index');

class Archetype extends Model { }

Archetype.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
}, {
  sequelize,
  modelName: 'archetypes',
  timestamps: false,
});

module.exports = Archetype;
