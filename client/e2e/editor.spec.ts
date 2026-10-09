import { expect, test, type Page } from '@playwright/test'
import { cardsFixture, deckFixture, dragTo, mockApi, savedDeckFixture } from './support'

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

test('adds and removes cards by dragging', async ({ page }) => {
  await mockApi(page)
  await openNewDeck(page)

  await dragTo(page, resultCard(page, spell.name), page.getByTestId('main-deck'))
  await expect(mainCount(page)).toHaveText('1')

  await dragTo(page, page.getByTestId('main-deck').getByTitle(spell.name), results(page))
  await expect(mainCount(page)).toHaveText('0')
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
