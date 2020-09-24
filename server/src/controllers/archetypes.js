const archetypes = require('../../data/archetypes.json');

exports.archetypes = (req, res) => {
  res.send(archetypes);
};
