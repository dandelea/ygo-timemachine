const ArchetypeService = require('../services/archetypes');

exports.archetypes = async (req, res) => {
  let result = await ArchetypeService.getAll();
  result = result.map((x) => x.id);
  res.send(result);
};
