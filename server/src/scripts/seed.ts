import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { migrateDatabase } from '../db/migrate.ts'
import { Card, Deck } from '../db/models.ts'
import { sequelize } from '../db/sequelize.ts'
import { logger } from '../logger.ts'
import { dataDir } from '../paths.ts'
import {
  seedCards,
  seedDecks,
  type SourceCard,
  type SourceDeck,
  type SourceSet,
} from '../seed/seed.ts'

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(dataDir, file), 'utf8')) as T
}

// Idempotent: each dataset is only loaded into empty tables, so the script can
// run on every start (the original seeder failed on the second run).
try {
  await migrateDatabase()
  if ((await Card.count()) === 0) {
    const [cards, sets] = await Promise.all([
      readJson<SourceCard[]>('cards.json'),
      readJson<SourceSet[]>('sets.json'),
    ])
    logger.info({ cards: await seedCards(cards, sets) }, 'Seeded cards')
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
