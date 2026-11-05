import { expect, test, type Page } from '@playwright/test'
import { cardsFixture, deckFixture, mockApi, savedDeckFixture } from './support'

const spell = cardsFixture.data.find((card) => card.type === 'SPELL')!
const extra = cardsFixture.data.find((card) => card.type === 'EXTRA')!

const results = (page: Page) => page.getByTestId('search-results')
const resultCard = (page: Page, name: string) => results(page).getByTitle(name, { exact: true })
const mainCount = (page: Page) => page.getByTestId('main-count')

async function openNewDeck(page: Page) {
  await page.goto('/decks/new')
  await expect(page.getByText(`Showing 12 of ${cardsFixture.total} results`)).toBeVisible()
}

test('adds and removes cards with buttons, respecting the copy limit', async ({ page }) => {
  await mockApi(page)
  await openNewDeck(page)

  const add = page.getByRole('button', { name: `Add ${spell.name} to the deck` })
  for (let i = 0; i < 3; i++) await add.click()
  await expect(mainCount(page)).toHaveText('3')
  await expect(add).toHaveCount(0)

  await page.getByRole('button', { name: `Add ${extra.name} to the deck` }).click()
  await expect(page.getByTestId('extra-count')).toHaveText('1')

  await page
    .getByRole('button', { name: `Remove ${spell.name} from the deck` })
    .first()
    .click()
  await expect(mainCount(page)).toHaveText('2')
})

test('shows the details of a selected card and keeps a history', async ({ page }) => {
  await mockApi(page)
  await openNewDeck(page)

  await resultCard(page, spell.name).click()
  await expect(page.getByRole('heading', { name: spell.name })).toBeVisible()
  await resultCard(page, extra.name).click()
  await expect(page.getByRole('heading', { name: extra.name })).toBeVisible()
  await expect(page.getByRole('button', { name: spell.name, exact: true })).toBeVisible()
})

test('searches with the selected filters', async ({ page }) => {
  const calls = await mockApi(page)
  await openNewDeck(page)

  await page.getByRole('tab', { name: 'Search', exact: true }).click()
  await page
    .locator('label')
    .filter({ hasText: /^Monsters$/ })
    .click()
  await page.getByPlaceholder('Search name or description').fill('dragon')
  await page.getByPlaceholder('Select an archetype').fill('blue')
  await page.getByText('Blue-Eyes', { exact: true }).click()

  await expect
    .poll(() => calls.filter((call) => call.path === '/cards').at(-1)?.body)
    .toMatchObject({ search: 'dragon', checks: ['MONSTER'], archetypes: ['Blue-Eyes'] })

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByPlaceholder('Search name or description')).toHaveValue('')
})

test('shows empty and failed searches, and retries', async ({ page }) => {
  let response: 'empty' | 'error' | 'ok' = 'empty'
  await mockApi(page, {
    'POST /cards': (route, useDefault) => {
      if (response === 'empty') return route.fulfill({ json: { total: 0, data: [] } })
      if (response === 'error') return route.fulfill({ status: 500 })
      return useDefault()
    },
  })
  await page.goto('/decks/new')
  await expect(page.getByRole('status').filter({ hasText: 'No cards match' })).toBeVisible()

  response = 'error'
  await page.getByRole('tab', { name: 'Search', exact: true }).click()
  await page.getByPlaceholder('Search name or description').fill('x')
  await page.getByRole('tab', { name: 'Result' }).click()
  const alert = page.getByRole('alert').filter({ hasText: 'Could not search cards' })
  await expect(alert).toBeVisible()

  response = 'ok'
  await alert.getByRole('button', { name: 'Retry' }).click()
  await expect(resultCard(page, spell.name)).toBeVisible()
})

test('creates a deck and confirms the save', async ({ page }) => {
  const calls = await mockApi(page)
  await openNewDeck(page)

  const save = page.getByRole('button', { name: 'Save deck' })
  await expect(save).toBeDisabled()
  await page.getByPlaceholder('Deck name').fill('My new deck')
  await page.getByRole('button', { name: `Add ${spell.name} to the deck` }).click()
  await save.click()

  await expect(page).toHaveURL(`/decks/${savedDeckFixture.id}`)
  const feedback = page.getByTestId('save-feedback')
  await expect(feedback).toHaveText(/Deck saved/)
  await expect(feedback).toBeHidden({ timeout: 5000 })

  const request = calls.find((call) => call.method === 'POST' && call.path === '/decks')
  expect(request?.body).toMatchObject({ name: 'My new deck', cards: [spell.id] })
  expect(calls.some((call) => call.path === `/decks/${savedDeckFixture.id}`)).toBe(false)
})

test('reports a failed save and lets the user dismiss it', async ({ page }) => {
  await mockApi(page, {
    [`POST /decks/${deckFixture.id}`]: (route) =>
      route.fulfill({ status: 400, json: { error: 'Invalid' } }),
  })
  await page.goto(`/decks/${deckFixture.id}`)
  await page.getByRole('button', { name: 'Save deck' }).click()

  const feedback = page.getByTestId('save-feedback')
  await expect(feedback).toHaveText(/Could not save the deck/)
  await expect(page).toHaveURL(`/decks/${deckFixture.id}`)
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(feedback).toBeHidden()
})

test('explains when a deck does not exist', async ({ page }) => {
  await mockApi(page)
  await page.goto('/decks/00000000-0000-4000-8000-000000000000')
  const alert = page.getByRole('alert')
  await expect(alert).toHaveText(/This deck does not exist/)
  await alert.getByRole('link', { name: 'Back to decks' }).click()
  await expect(page).toHaveURL('/')
})

test('explains the date and the deck rules', async ({ page }) => {
  await mockApi(page)
  await openNewDeck(page)

  await page.getByRole('tab', { name: 'Search', exact: true }).click()
  await expect(page.getByTestId('epoch-hint')).toContainText('Only cards released up to')

  const rules = page.getByRole('button', { name: 'Deck rules' })
  await rules.click()
  await expect(page.getByText('Main deck: 40–60 cards.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Main deck: 40–60 cards.')).toBeHidden()
  await expect(rules).toBeFocused()
})

test('shows the result count on the Result tab while filtering', async ({ page }) => {
  await mockApi(page, {
    'POST /cards': (route, useDefault) =>
      route.request().postDataJSON()?.search === 'nothing'
        ? route.fulfill({ json: { total: 0, data: [] } })
        : useDefault(),
  })
  await openNewDeck(page)

  const count = page.getByTestId('result-count')
  await expect(count).toHaveText(`· ${cardsFixture.total}`)
  await page.getByRole('tab', { name: 'Search', exact: true }).click()
  await page.getByPlaceholder('Search name or description').fill('nothing')
  await expect(count).toHaveText('· 0')
})

test('explains deck size, blocked cards and icon buttons', async ({ page }) => {
  await mockApi(page)
  await openNewDeck(page)

  await expect(page.getByTestId('deck-draft')).toHaveText(
    'Draft: 40 cards missing for a legal Main deck. You can still save it.',
  )

  const save = page.getByRole('button', { name: 'Save deck' })
  await save.locator('..').hover()
  await expect(page.getByRole('tooltip')).toHaveText('Give the deck a name to save it')
  await page.getByPlaceholder('Deck name').fill('Draft deck')
  await save.hover()
  await expect(page.getByRole('tooltip')).toHaveText('Save deck')

  const add = page.getByRole('button', { name: `Add ${spell.name} to the deck` })
  for (let i = 0; i < 3; i++) await add.click()
  await expect(page.getByTestId('deck-draft')).toContainText('37 cards missing')
  const blocked = resultCard(page, spell.name).getByTestId('add-blocked')
  await expect(blocked).toContainText('3/3')
  await blocked.hover()
  await expect(page.getByRole('tooltip')).toHaveText('You already have 3 copies of this card')
})

test('filters by attribute, level and monster type with the keyboard only', async ({ page }) => {
  const calls = await mockApi(page)
  await openNewDeck(page)
  await page.getByRole('tab', { name: 'Search', exact: true }).click()

  await page.getByRole('button', { name: 'Earth', exact: true }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Wind', exact: true })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Wind', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: 'Level 4', exact: true }).focus()
  await page.keyboard.press('Enter')

  const dragon = page.getByRole('checkbox', { name: /Dragon/ }).first()
  await dragon.focus()
  await page.keyboard.press('Space')
  await expect(dragon).toBeChecked()

  await expect
    .poll(() => calls.filter((call) => call.path === '/cards').at(-1)?.body)
    .toMatchObject({ attributes: ['WIND'], levels: [4] })
})

test('stops the time machine at the last day of the data', async ({ page }) => {
  const calls = await mockApi(page)
  await openNewDeck(page)

  // Only one search on load, already with the last day of the data.
  const epochs = () =>
    calls
      .filter((call) => call.path === '/cards')
      .map((call) => (call.body as { epoch: string }).epoch)
  await expect.poll(epochs).toEqual(['2020-06-02'])
  await page.getByRole('tab', { name: 'Search', exact: true }).click()
  await expect(page.locator('#epoch')).toHaveValue('2020-06-02')
  expect(epochs()).toEqual(['2020-06-02'])
  await expect(page.getByTestId('data-end-hint')).toHaveText(
    'The data goes up to June 2nd, 2020, so later dates cannot be chosen.',
  )
})

test('shows the deck statistics in their own tab', async ({ page }) => {
  await mockApi(page)
  await page.goto(`/decks/${deckFixture.id}`)

  await page.getByRole('tab', { name: 'Statistics' }).click()
  const stats = page.getByTestId('deck-stats')
  await expect(stats).toContainText(
    `Main ${deckFixture.main.length} · Extra ${deckFixture.extra.length}`,
  )
  await expect(page.getByTestId('main-deck')).toBeHidden()
  await page.getByRole('tab', { name: 'Cards' }).click()
  await expect(page.getByTestId('main-deck')).toBeVisible()
})
