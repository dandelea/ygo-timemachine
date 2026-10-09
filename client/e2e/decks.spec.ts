import { expect, test } from '@playwright/test'
import { deckFixture, mockApi } from './support'

test('lists the decks and opens one in the editor', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Yosenju' })).toBeVisible()
  await page.getByRole('link', { name: deckFixture.name }).click()

  await expect(page).toHaveURL(`/decks/${deckFixture.id}`)
  await expect(page.getByPlaceholder('Deck name')).toHaveValue(deckFixture.name)
  await expect(page.getByTestId('main-count')).toHaveText(String(deckFixture.main.length))
  await expect(page.getByTestId('extra-count')).toHaveText(String(deckFixture.extra.length))
  await expect(page).toHaveTitle(`YuGiOh! TimeMachine - Deck ${deckFixture.name}`)
})

test('shows an empty state when there are no decks', async ({ page }) => {
  await mockApi(page, { 'GET /decks': (route) => route.fulfill({ json: [] }) })
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText(/There are no decks yet/)
})

test('recovers from a failed deck list request', async ({ page }) => {
  let failures = 1
  await mockApi(page, {
    'GET /decks': (route, useDefault) =>
      failures-- > 0 ? route.fulfill({ status: 500 }) : useDefault(),
  })
  await page.goto('/')

  const alert = page.getByRole('alert')
  await expect(alert).toHaveText(/Could not load the decks/)
  await alert.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByRole('link', { name: 'Yosenju' })).toBeVisible()
})

test('shows the credits', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'Credits' }).click()
  await expect(page.getByText(/is copyright 4K Media Inc/)).toBeVisible()
})
