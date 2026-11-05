import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CardDetail from '@/components/editor/CardDetail.vue'
import DeckPanel from '@/components/editor/DeckPanel.vue'
import SaveFeedback from '@/components/editor/SaveFeedback.vue'
import SearchResults from '@/components/editor/SearchResults.vue'
import DeckLimits from '@/components/help/DeckLimits.vue'
import type { EditableDeck } from '@/services/deck'
import { useDecksStore } from '@/stores/decks'
import DecksView from '@/views/Decks.vue'
import { fixtures, mountWithApp } from './helpers'

afterEach(() => {
  vi.useRealTimers()
})

describe('Decks view', () => {
  it('lists the decks once loaded', async () => {
    const wrapper = mountWithApp(DecksView, {}, { stubActions: true })
    const store = useDecksStore()
    store.decks = fixtures.decks()
    store.status = 'ready'
    await flushPromises()
    expect(store.load).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Yosenju')
    expect(wrapper.text()).toContain('Forbidden Bandit')
  })

  it.each([
    ['loading', 'Loading decks...'],
    ['error', 'Could not load the decks.'],
    ['ready', 'There are no decks yet.'],
  ] as const)('shows the %s state', async (status, message) => {
    const wrapper = mountWithApp(DecksView, {}, { stubActions: true })
    useDecksStore().status = status
    await flushPromises()
    expect(wrapper.text()).toContain(message)
  })

  it('explains the app even when there are decks', async () => {
    const wrapper = mountWithApp(DecksView, {}, { stubActions: true })
    const store = useDecksStore()
    store.decks = fixtures.decks()
    store.status = 'ready'
    await flushPromises()
    const intro = wrapper.get('[data-testid="home-intro"]')
    expect(intro.text()).toContain('Build decks as they were played in another era')
    expect(intro.text()).toContain('Add 40 to 60 cards, up to 3 copies of each.')
  })

  it('retries after an error', async () => {
    const wrapper = mountWithApp(DecksView, {}, { stubActions: true })
    const store = useDecksStore()
    store.status = 'error'
    await flushPromises()
    await wrapper.get('[role="alert"] button').trigger('click')
    expect(store.load).toHaveBeenCalledTimes(2)
  })
})

describe('SearchResults', () => {
  const props = () => ({
    results: fixtures.cards(),
    stats: fixtures.stats(),
    status: 'ready' as const,
    blockReason: () => null,
  })

  it('shows the counter and lets the user add or select cards', async () => {
    const wrapper = mountWithApp(SearchResults, { props: props() })
    const [first] = fixtures.cards().data
    expect(wrapper.text()).toContain('Showing 12 of 12 results')
    await wrapper.get(`[aria-label="Add ${first!.name} to the deck"]`).trigger('click')
    expect(wrapper.emitted('add')).toEqual([[first]])
    expect(wrapper.emitted('select')).toBeUndefined()
    await wrapper.get(`[title="${first!.name}"]`).trigger('click')
    expect(wrapper.emitted('select')).toEqual([[first]])
  })

  it('hides the add button for cards that cannot be added', () => {
    const wrapper = mountWithApp(SearchResults, {
      props: { ...props(), blockReason: () => 'copies' as const },
    })
    expect(wrapper.find('[aria-label^="Add "]').exists()).toBe(false)
    const blocked = wrapper.findAll('[data-testid="add-blocked"]')
    expect(blocked).toHaveLength(fixtures.cards().data.length)
    expect(blocked[0]!.text()).toContain('3/3')
    expect(blocked[0]!.text()).toContain('You already have 3 copies of this card')
  })

  it('says when the deck is full', () => {
    const wrapper = mountWithApp(SearchResults, {
      props: { ...props(), blockReason: () => 'main-full' as const },
    })
    const blocked = wrapper.get('[data-testid="add-blocked"]')
    expect(blocked.text()).toContain('Full')
    expect(blocked.text()).toContain('The Main deck is full (60 cards)')
  })

  it('shows empty, loading and error states', async () => {
    const wrapper = mountWithApp(SearchResults, {
      props: { ...props(), results: { total: 0, data: [] } },
    })
    expect(wrapper.text()).toContain('No cards match these filters.')
    await wrapper.setProps({ status: 'loading' })
    expect(wrapper.get('[data-testid="search-results"]').attributes('aria-busy')).toBe('true')
    await wrapper.setProps({ status: 'error' })
    await wrapper.get('[role="alert"] button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

describe('DeckPanel', () => {
  const deck = (): EditableDeck => {
    const { id, name, color, main, extra } = fixtures.deck()
    return { id, name, color, main, extra }
  }

  it('shows the card counts and both sections', () => {
    const wrapper = mountWithApp(DeckPanel, { props: { deck: deck(), canSave: true } })
    expect(wrapper.get('[data-testid="main-count"]').text()).toBe(String(deck().main.length))
    expect(wrapper.get('[data-testid="extra-count"]').text()).toBe(String(deck().extra.length))
    expect(wrapper.findAll('[data-testid="main-deck"] > *')).toHaveLength(40)
    expect(wrapper.findAll('[data-testid="extra-deck"] > *')).toHaveLength(15)
  })

  it('emits name changes, removals and saves', async () => {
    const wrapper = mountWithApp(DeckPanel, { props: { deck: deck(), canSave: true } })
    await wrapper.get('input[type="search"]').setValue('Renamed')
    expect(wrapper.emitted('update:name')).toEqual([['Renamed']])
    await wrapper.get('[aria-label^="Remove "]').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
    await wrapper.get('[aria-label="Save deck"]').trigger('click')
    expect(wrapper.emitted('save')).toHaveLength(1)
  })

  it('shows the deck rules from the info button and hides them with Escape', async () => {
    const wrapper = mountWithApp(DeckPanel, {
      props: { deck: deck(), canSave: true },
      attachTo: document.body,
    })
    const button = wrapper.get('[aria-label="Deck rules"]')
    const panel = wrapper.get(`#${button.attributes('aria-controls')}`)
    expect(panel.isVisible()).toBe(false)

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(panel.isVisible()).toBe(true)
    expect(panel.text()).toContain('Main deck: 40–60 cards.')
    expect(panel.text()).toContain('Extra deck: up to 15 cards')
    expect(panel.text()).toContain('Up to 3 copies of each card.')

    await button.trigger('keydown', { key: 'Escape' })
    expect(panel.isVisible()).toBe(false)
    wrapper.unmount()
  })

  it('disables saving when not allowed', () => {
    const wrapper = mountWithApp(DeckPanel, { props: { deck: deck(), canSave: false } })
    expect(wrapper.get('[aria-label="Save deck"]').attributes('disabled')).toBeDefined()
  })
})

describe('DeckLimits', () => {
  it.each([
    [0, 'Draft: 40 cards missing for a legal Main deck. You can still save it.'],
    [39, 'Draft: 1 card missing for a legal Main deck. You can still save it.'],
    [40, 'Legal Main deck (40–60 cards).'],
    [60, 'Legal Main deck (40–60 cards).'],
  ])('with %i Main deck cards says "%s"', (main, message) => {
    const wrapper = mountWithApp(DeckLimits, { props: { main, extra: 0 } })
    expect(wrapper.text()).toContain(message)
  })
})

describe('SaveFeedback', () => {
  it('announces success and hides it after a few seconds', async () => {
    vi.useFakeTimers()
    const wrapper = mountWithApp(SaveFeedback, { props: { status: 'idle' } })
    await wrapper.setProps({ status: 'saved' })
    expect(wrapper.get('[role="status"]').text()).toContain('Deck saved')
    vi.advanceTimersByTime(3000)
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('keeps errors until dismissed', async () => {
    vi.useFakeTimers()
    const wrapper = mountWithApp(SaveFeedback, { props: { status: 'idle' } })
    await wrapper.setProps({ status: 'error' })
    vi.advanceTimersByTime(10_000)
    expect(wrapper.emitted('dismiss')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not save the deck')
    await wrapper.get('[aria-label="Dismiss"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})

describe('CardDetail', () => {
  it('shows the card back when nothing is selected', () => {
    const wrapper = mountWithApp(CardDetail, { props: { card: null } })
    expect(wrapper.get('img').attributes('alt')).toBe('No card')
    expect(wrapper.text()).toContain('Click any card in your deck or in the results')
  })

  it('shows card details with its release date', () => {
    const card = fixtures.deck().main[0]!
    const wrapper = mountWithApp(CardDetail, { props: { card } })
    expect(wrapper.get('h2').text()).toBe(card.name)
    expect(wrapper.text()).not.toContain('Click any card')
    expect(wrapper.text()).toContain('First release:')
    if (card.atk !== null) expect(wrapper.text()).toContain(`ATK ${card.atk}`)
  })
})
