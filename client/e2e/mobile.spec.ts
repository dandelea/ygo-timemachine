import { expect, test } from '@playwright/test'
import { cardsFixture, deckFixture, mockApi } from './support'

const spell = cardsFixture.data.find((card) => card.type === 'SPELL')!

test('switches between editor sections on small screens', async ({ page }) => {
  await mockApi(page)
  await page.goto(`/decks/${deckFixture.id}`)

  const sections = page.getByRole('tablist', { name: 'Editor sections' })
  await expect(sections).toBeVisible()
  await expect(page.getByPlaceholder('Deck name')).toBeVisible()
  await expect(page.getByTestId('search-results')).toBeHidden()

  await sections.getByRole('tab', { name: 'Search' }).tap()
  await expect(page.getByPlaceholder('Deck name')).toBeHidden()
  await page.getByRole('button', { name: `Add ${spell.name} to the deck` }).tap()

  await page.getByTestId('search-results').getByTitle(spell.name, { exact: true }).tap()
  await expect(page.getByRole('heading', { name: spell.name })).toBeVisible()

  await sections.getByRole('tab', { name: 'Deck' }).tap()
  await expect(page.getByTestId('main-count')).toHaveText(String(deckFixture.main.length + 1))
})

test('lets the page scroll on small screens', async ({ page }) => {
  await mockApi(page)
  await page.goto(`/decks/${deckFixture.id}`)
  await page.getByRole('tab', { name: 'Search' }).first().tap()
  await page.getByRole('tab', { name: 'Search', exact: true }).last().tap()

  const lastFilter = page.getByText('Counter', { exact: true })
  await lastFilter.scrollIntoViewIfNeeded()
  await expect(lastFilter).toBeInViewport()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})
