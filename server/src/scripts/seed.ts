import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { migrateDatabase } from '../db/migrate.ts'
import { Card, CardPrinting, Deck } from '../db/models.ts'
import { sequelize } from '../db/sequelize.ts'
import { logger } from '../logger.ts'
import { dataDir } from '../paths.ts'
import {
  syncCards,
  seedCardDetails,
  seedCards,
  seedDecks,
  type SourceCard,
  type SourceDeck,
  type SourceFormat,
  type SourceSet,
} from '../seed/seed.ts'

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(dataDir, file), 'utf8')) as T
}

// Idempotent: each dataset is only loaded into empty tables, so the script can
// run on every start (the original seeder failed on the second run).
// `--sync` (npm run seed:sync) applies newer data files to a database that
// already has cards; see scripts/refresh-data.ts.
const sync = process.argv.includes('--sync')

try {
  await migrateDatabase()
  if (sync && (await Card.count()) > 0) {
    const [cards, sets, { formats }] = await Promise.all([
      readJson<SourceCard[]>('cards.json'),
      readJson<SourceSet[]>('sets.json'),
      readJson<{ formats: SourceFormat[] }>('formats.json'),
    ])
    logger.info(await syncCards(cards, sets, formats), 'Synced cards with the data files')
  }
  const needsCards = (await Card.count()) === 0
  const needsDetails = (await CardPrinting.count()) === 0
  if (needsCards || needsDetails) {
    const [cards, sets, { formats }] = await Promise.all([
      readJson<SourceCard[]>('cards.json'),
      readJson<SourceSet[]>('sets.json'),
      readJson<{ formats: SourceFormat[] }>('formats.json'),
    ])
    if (needsCards) logger.info({ cards: await seedCards(cards, sets) }, 'Seeded cards')
    logger.info(await seedCardDetails(cards, sets, formats), 'Seeded sets, printings and formats')
  } else {
    logger.info('Cards already seeded')
  }
  if ((await Deck.count()) === 0) {
    logger.info(
      { decks: await seedDecks(await readJson<SourceDeck[]>('decks.json')) },
      'Seeded decks',
    )
  } else {
    logger.info('Decks already seeded')
  }
} catch (error) {
  logger.fatal({ err: error }, 'Seed failed')
  process.exitCode = 1
} finally {
  await sequelize.close()
}
