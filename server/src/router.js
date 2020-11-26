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

const decks = require('./controllers/decks');

router.get('/decks', decks.getAll);
router.get('/decks/:id', decks.get);
router.post('/decks/:id', decks.edit);

module.exports = router;
