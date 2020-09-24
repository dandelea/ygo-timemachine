const express = require('express');

const router = express.Router();

const misc = require('./controllers/misc');

router.get('/ping', misc.ping);
router.get('/version', misc.version);
router.get('/stats', misc.dbStats);

const archetypes = require('./controllers/archetypes');

router.get('/archetypes', archetypes.archetypes);

const cards = require('./controllers/cards');

router.post('/cards', cards.cards);
router.get('/cards/:id', cards.card);

module.exports = router;
