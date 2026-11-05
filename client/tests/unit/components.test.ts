import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CardDetail from '@/components/editor/CardDetail.vue'
import DeckPanel from '@/components/editor/DeckPanel.vue'
import SaveFeedback from '@/components/editor/SaveFeedback.vue'
import DeckStats from '@/components/editor/DeckStats.vue'
import SearchFilters from '@/components/editor/SearchFilters.vue'
import SearchResults from '@/components/editor/SearchResults.vue'
import HomeIntro from '@/components/help/HomeIntro.vue'
import AttributeToggle from '@/components/form/AttributeToggle.vue'
import LevelToggle from '@/components/form/LevelToggle.vue'
import DeckLimits from '@/components/help/DeckLimits.vue'
import * as api from '@/services/api'
import type { EditableDeck } from '@/services/deck'
import { createSearchForm } from '@/services/search-form'
import type { Card } from '@/types/api'
import { reactive } from 'vue'
import { useDecksStore } from '@/stores/decks'
import DecksView from '@/views/Decks.vue'
import { fixtures, mountWithApp } from './helpers'

vi.mock('@/services/api')
const mocked = vi.mocked(api)

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
})

const printing = (set: string, date: string, rarity = 'Common') => ({
  set,
  code: `${set.slice(0, 3).toUpperCase()}-EN001`,
  rarity,
  date,
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
    const { id, name, color, format, main, extra } = fixtures.deck()
    return { id, name, color, format, main, extra }
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

  it('switches between the cards and the statistics', async () => {
    const wrapper = mountWithApp(DeckPanel, { props: { deck: deck(), canSave: true } })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((tab) => tab.text())).toEqual(['Cards', 'Statistics'])
    expect(wrapper.find('[data-testid="deck-stats"]').exists()).toBe(false)
    await tabs[1]!.trigger('click')
    expect(tabs[1]!.attributes('aria-selected')).toBe('true')
    expect(wrapper.find('[data-testid="deck-stats"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="main-deck"]').exists()).toBe(false)
    await tabs[0]!.trigger('click')
    expect(wrapper.find('[data-testid="main-deck"]').exists()).toBe(true)
  })

  it('disables saving when not allowed', () => {
    const wrapper = mountWithApp(DeckPanel, { props: { deck: deck(), canSave: false } })
    expect(wrapper.get('[aria-label="Save deck"]').attributes('disabled')).toBeDefined()
  })
})

describe('format limits in the results', () => {
  it('marks restricted cards and explains why they cannot be added', () => {
    const [first, second, third] = fixtures.cards().data as [Card, Card, Card]
    const limits: Record<number, number> = { [first.id]: 0, [second.id]: 1, [third.id]: 2 }
    const wrapper = mountWithApp(SearchResults, {
      props: {
        results: fixtures.cards(),
        stats: fixtures.stats(),
        status: 'ready' as const,
        blockReason: (card: Card) =>
          card.id === first.id
            ? ('forbidden' as const)
            : card.id === second.id
              ? ('format-copies' as const)
              : null,
        limitOf: (card: Card) => limits[card.id] ?? null,
        formatName: 'GOAT',
      },
    })
    const badges = wrapper.findAll('[data-testid="format-badge"]')
    expect(badges.map((badge) => badge.text())).toEqual([
      '✕Forbidden in the GOAT format',
      '1Limited to 1 copy in the GOAT format',
      '2Semi-limited to 2 copies in the GOAT format',
    ])
    const blocked = wrapper.findAll('[data-testid="add-blocked"]')
    expect(blocked.map((item) => item.text())).toEqual([
      'ForbiddenForbidden in the GOAT format',
      '1/1You already have the copy the GOAT format allows',
    ])
  })
})

describe('SearchFilters', () => {
  const formats = fixtures.formats()

  // The date picker and the range sliders need it; jsdom does not have it.
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('chooses the deck format, which replaces the date', async () => {
    // The panel edits the form in place, as it does with the store's form.
    const form = reactive(createSearchForm('2020-06-02'))
    const wrapper = mountWithApp(SearchFilters, {
      props: { archetypes: [], formats, modelValue: form },
    })
    const options = wrapper.findAll('[role="radio"]')
    expect(options.map((option) => option.text())).toEqual(['Free', 'GOAT', 'Edison'])
    expect(options[0]!.attributes('aria-checked')).toBe('true')
    expect(wrapper.find('[data-testid="epoch-hint"]').exists()).toBe(true)

    await options[1]!.trigger('click')
    expect(form.format).toBe('goat')
    expect(wrapper.find('[data-testid="epoch-hint"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="format-hint"]').text()).toContain(
      'GOAT format: only its 6 legal cards',
    )
    expect(wrapper.text()).toContain('— GOAT format —')
  })

  it('toggles Link ratings and arrows', async () => {
    const form = createSearchForm('2020-06-02')
    const wrapper = mountWithApp(SearchFilters, { props: { archetypes: [], modelValue: form } })
    expect(wrapper.find('[role="radio"]').exists()).toBe(false)
    await wrapper
      .get('[role="group"][aria-label="Link rating"] button:nth-of-type(3)')
      .trigger('click')
    await wrapper.get('[aria-label="Top-left arrow"]').trigger('click')
    expect(form.linkValues[3]).toBe(true)
    expect(form.linkMarkers['Top-Left']).toBe(true)
    expect(wrapper.get('[aria-label="Top-left arrow"]').attributes('aria-pressed')).toBe('true')
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

describe('HomeIntro', () => {
  it('says up to which day dates can be chosen', () => {
    const wrapper = mountWithApp(HomeIntro, { props: { dataEnd: '2020-06-02' } })
    expect(wrapper.text()).toContain('Choose a date up to June 2nd, 2020 in the deck editor.')
  })

  it('falls back to the plain step while the date is unknown', () => {
    const wrapper = mountWithApp(HomeIntro, { props: { dataEnd: null } })
    expect(wrapper.text()).toContain('Choose the date in the deck editor.')
  })
})

describe('DeckStats', () => {
  it('shows the composition, attributes, levels and archetypes of the deck', () => {
    const { main, extra } = fixtures.deck()
    const wrapper = mountWithApp(DeckStats, { props: { deck: { main, extra } } })
    const text = wrapper.text()
    expect(text).toContain(`Main ${main.length} · Extra ${extra.length}`)
    for (const label of ['Composition', 'Monsters:', 'Spells:', 'Traps:', 'Extra:', 'Attributes']) {
      expect(text).toContain(label)
    }
    expect(wrapper.findAll('[aria-label^="Level "]')).toHaveLength(12)
  })

  it('invites to add cards when the deck is empty', () => {
    const wrapper = mountWithApp(DeckStats, { props: { deck: { main: [], extra: [] } } })
    expect(wrapper.text()).toContain('Add cards to see the deck statistics.')
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

  it('shows the Link rating and arrows, or the Pendulum scale', () => {
    const base = fixtures.deck().main[0]!
    const link: Card = {
      ...base,
      link_value: 3,
      link_markers: ['Top', 'Bottom-Left', 'Bottom-Right'],
    }
    const wrapper = mountWithApp(CardDetail, { props: { card: link } })
    expect(wrapper.get('[data-testid="card-link"]').text()).toContain('LINK-3')
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe(
      'Link arrows: Top arrow, Bottom-left arrow, Bottom-right arrow',
    )
    expect(wrapper.find('[data-testid="card-scale"]').exists()).toBe(false)

    const pendulum = mountWithApp(CardDetail, { props: { card: { ...base, pendulum_scale: 4 } } })
    expect(pendulum.get('[data-testid="card-scale"]').text()).toBe('Pendulum scale 4')
  })

  it('lists the printings up to the date, five at first', async () => {
    mocked.getPrintings.mockResolvedValue({
      total: 9,
      printings: Array.from({ length: 7 }, (_, i) => printing(`Set ${i}`, `2003-0${i + 1}-01`)),
    })
    const card = fixtures.deck().main[0]!
    const wrapper = mountWithApp(CardDetail, { props: { card, until: '2004-03-01' } })
    await flushPromises()
    expect(mocked.getPrintings).toHaveBeenCalledWith(card.id, '2004-03-01')
    const section = wrapper.get('[data-testid="card-printings"]')
    expect(section.text()).toContain('7 up to March 1st, 2004 · 9 in total')
    expect(section.findAll('tr')).toHaveLength(5)
    await section.get('button').trigger('click')
    expect(section.findAll('tr')).toHaveLength(7)
    expect(section.get('button').text()).toBe('Show fewer')
  })

  it('hides the printings when there are none, and reports errors', async () => {
    const card = fixtures.deck().main[0]!
    mocked.getPrintings.mockResolvedValue({ total: 2, printings: [] })
    const empty = mountWithApp(CardDetail, { props: { card, until: '2001-01-01' } })
    await flushPromises()
    expect(empty.find('[data-testid="card-printings"]').exists()).toBe(false)

    mocked.getPrintings.mockRejectedValue(new Error('offline'))
    const failing = mountWithApp(CardDetail, { props: { card } })
    await flushPromises()
    expect(failing.text()).toContain('Could not load the printings of this card.')
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

describe('filter toggles', () => {
  it.each([
    ['AttributeToggle', AttributeToggle, { id: 'DARK', label: 'Dark', image: 'dark.png' }],
    [
      'LevelToggle',
      LevelToggle,
      { id: 'level_4', label: 'Level 4', images: { active: 'on.svg', inactive: 'off.svg' } },
    ],
  ] as const)('%s is a toggle button', async (_, component, props) => {
    const wrapper = mountWithApp(component, { props: { ...props, modelValue: false } })
    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toBe(props.label)
    expect(button.attributes('aria-pressed')).toBe('false')
    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    await wrapper.setProps({ modelValue: true })
    expect(button.attributes('aria-pressed')).toBe('true')
  })
})
