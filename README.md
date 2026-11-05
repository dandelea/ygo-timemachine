# ygo-timemachine

Yu-Gi-Oh! card explorer and deck builder filtered by era: pick a date and only the
cards released up to that day are available, so you can build decks as they could
have been played at that time.

- Search cards by name or text, type, attribute, level, ATK/DEF, Link rating and
  arrows, Pendulum scale, monster type, archetype and spell/trap family, as of
  any date up to the last day the card data covers.
- See each card's printings (set, code and rarity) up to the chosen date.
- Build decks with the add/remove buttons, respecting the copy and
  deck size limits, and see their statistics.
- Build for the GOAT or Edison retro formats: only their legal cards, with
  their Forbidden and Limited lists.
- English and Spanish interface. Works on desktop and mobile.

Card images are linked from [YGOPRODeck](https://ygoprodeck.com/).

## Stack

| Part   | Technology                                                                         |
| ------ | ---------------------------------------------------------------------------------- |
| Client | Vue 3, TypeScript, Vite, Pinia, Vue Router, vue-i18n, Tailwind CSS                 |
| API    | Node.js 24, TypeScript, Express 5, Sequelize 6, Zod, Pino                          |
| Data   | SQLite in development and tests, PostgreSQL in production, optional Redis cache    |
| Tests  | Vitest, Vue Test Utils, Supertest, Playwright                                      |
| Infra  | Docker images for the client (nginx), the API and an nginx gateway; Docker Compose |

```
client/   Vue single page app
server/   REST API; server/data holds the card and deck seed data
nginx/    Gateway that serves the client at / and the API at /api
```

## Requirements

- Node.js 24 (see `.nvmrc`) and npm 11, or
- Docker with Docker Compose.

## Local development without Docker

```sh
# API on http://localhost:5000, using SQLite in server/db
cd server
npm ci
npm run seed   # loads server/data; safe to run again
npm run dev

# Client on http://localhost:3000, proxying /api to the API
cd client
npm ci
npm run dev
```

The API reads its settings from the environment or from `server/.env`; see
[`server/.env.example`](server/.env.example). Everything has a development default,
and Redis is used only when `REDIS_URL` (or `REDIS_HOST`) is set.

## Docker

Development, with the sources mounted and reloaded on change, SQLite and Redis:

```sh
docker compose -f docker-compose.dev.yml up --build
```

Production-like, with the built images, PostgreSQL and Redis:

```sh
cp .env.example .env   # set POSTGRES_PASSWORD
docker compose up --build
```

Both serve the app on http://localhost:3050 (change it with `HTTP_PORT`). The API
seeds the database on start-up; seeding is idempotent.

## Deploying to Vercel

The repository is ready to deploy on [Vercel](https://vercel.com) (Hobby plan)
with a [Neon](https://neon.com) PostgreSQL database, both free. `vercel.json`
defines two [services](https://vercel.com/docs/services) in one project: `web`
serves the client as static files and `api` serves the API as one function
under `/api` (from [`server/src/serverless.ts`](server/src/serverless.ts)).
Pushes to `develop` are not deployed.

1. Create a Neon project in the Frankfurt region (`fra1` is where the function
   runs) and copy its pooled connection string.
2. Create the schema and load the data once, from your machine:

   ```sh
   cd server
   DATABASE_URL='postgresql://…?sslmode=require' npm run seed
   ```

   Run it again after adding a migration. After updating the card data (see
   [Card data](#card-data)), apply it with `npm run seed:sync` the same way.
3. Import the repository in Vercel (it is detected as a multi-service project
   and configured from `vercel.json`) and add `DATABASE_URL` as an environment
   variable for Production.
4. Add the custom domain in the Vercel project and create the `CNAME` record it
   asks for in the domain's DNS provider.

Redis is not used there; card searches go straight to the database.

## Database migrations

The API applies pending migrations on start-up (and the seed script does too),
recording them in the `SequelizeMeta` table. To change the schema, add a file to
`server/src/db/migrations/` and append it to the list in
`server/src/db/migrate.ts`; never edit a migration that has already been released.
A test checks that the migrations create the same schema as the models.

## Card data

The cards come from the [YGOPRODeck API](https://ygoprodeck.com/api-guide/) and
are stored in `server/data`; the app never calls the API at runtime. Card images
are linked from YGOPRODeck.

| File              | Contents                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `cards.json`      | Every card, with its printings, images and Link/Pendulum values          |
| `sets.json`       | Every set with its TCG release date (used for each card's first release) |
| `formats.json`    | Legal cards and Forbidden/Limited list of the GOAT and Edison formats    |
| `card-types.json` | Subtypes grouped as Monster, Spell, Trap and Extra                        |
| `version.json`    | YGOPRODeck database version the files were downloaded from               |
| `decks.json`      | Sample decks loaded into an empty database                                |

Commands, run in `server/`:

```sh
npm run seed           # empty database: load everything; existing one: only what is missing
npm run data:refresh   # download newer data from YGOPRODeck into server/data
npm run seed:sync      # apply the data files to a database that already has cards
npm run data:formats   # download only the GOAT and Edison formats
```

To update the data by hand:

1. `npm run data:refresh`. It checks the YGOPRODeck database version first and
   downloads nothing when it matches `version.json` (add `-- --force` to download
   anyway). Otherwise it makes 8 requests: the version, all cards, all sets and
   the formats.
2. If it warns about subtypes missing from `card-types.json`, add them to the
   right group. Cards with an unknown subtype match no type filter.
3. Review and commit the files in `server/data`.
4. Run `npm run seed:sync` against each database: locally, and with
   `DATABASE_URL` for production. It updates cards by id and adds new ones.
   It removes cards that are no longer in the data unless a deck uses them, and
   replaces sets, printings and formats. Saved decks are kept.

YGOPRODeck allows 20 requests per second and blocks an IP for one hour above
that. The scripts make one request at a time with a 2 s pause between them,
and they stop at the first error instead of retrying.

## Configuration

| Variable                                               | Default                                     | Description                                     |
| ------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------- |
| `NODE_ENV`                                             | `development`                               | `development`, `test` or `production`           |
| `PORT`                                                 | `5000`                                      | API port                                        |
| `LOG_LEVEL`                                            | `debug` / `silent` (test) / `info` (prod)   | Pino log level                                  |
| `DB_DIALECT`                                           | `sqlite`, or `postgres` in production       | Database engine                                 |
| `SQLITE_STORAGE`                                       | `db/dev.sqlite` (`:memory:` in tests)       | SQLite file                                     |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | `localhost`, `5432`, `postgres`, –, `postgres` | PostgreSQL connection                           |
| `PGSSLMODE`                                            | –                                           | `require` or `verify-full` to connect over SSL  |
| `DATABASE_URL`                                         | –                                           | Connection string; overrides the `PG*` variables |
| `REDIS_URL`                                            | –                                           | Redis cache; without it searches are not cached |
| `CORS_ORIGINS`                                         | Vite dev origins in development, none otherwise | Comma-separated origins allowed cross-origin |

The configuration is validated on start-up and the API refuses to start with an
invalid value.

## Quality checks

Both `client/` and `server/` have the same scripts:

```sh
npm run lint          # ESLint
npm run format:check  # Prettier (npm run format to fix)
npm run typecheck
npm test              # Vitest
npm run build
```

The client also has end-to-end tests that run against the production build with
the API mocked in the browser:

```sh
cd client
npx playwright install chromium   # once
npm run test:e2e
```

The client keeps its own copy of the API types. Its tests check them against the
fixtures in `client/tests/fixtures/api`, and the server tests check that those
fixtures still match the real API responses.

### Git hooks

Run `npm install` once at the repository root to enable the pre-commit hook
(Husky + lint-staged). It runs ESLint with `--fix` and Prettier on the staged
files of each package, with that package's own configuration, and blocks the
commit if a problem cannot be fixed automatically.

### VS Code

The `.vscode` folder recommends the extensions used in the project and sets up
format on save with Prettier and ESLint fixes. The debug configurations are:

- **API: dev**: the API in watch mode, with breakpoints in the TypeScript sources.
- **API: seed database**.
- **Client: Chrome**: starts Vite and opens Chrome, with breakpoints in the Vue and
  TypeScript sources.
- **Full stack**: the API and the client together.
- **API/Client: tests (current file)**: debugs the open Vitest test file.

## License

[AGPL-3.0-only](https://www.gnu.org/licenses/agpl-3.0.html). Yu-Gi-Oh! is a
trademark of its respective owners; this project is not affiliated with them.
