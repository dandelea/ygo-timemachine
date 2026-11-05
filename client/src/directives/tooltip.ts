import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import type { Directive } from 'vue'

/**
 * `v-tooltip="text"`: a styled label for icon buttons, replacing the native
 * `title`. It shows on mouse hover, on keyboard focus and on a long press on
 * touch screens (where `title` never shows), and hides with Escape.
 */

const LONG_PRESS_MS = 500
const TOUCH_VISIBLE_MS = 2000

interface TooltipState {
  text: string
  tip: HTMLElement | null
  stopPositioning: (() => void) | null
  pressTimer: ReturnType<typeof setTimeout> | undefined
  hideTimer: ReturnType<typeof setTimeout> | undefined
  suppressClick: boolean
  listeners: [keyof HTMLElementEventMap, EventListener, AddEventListenerOptions?][]
}

const states = new WeakMap<HTMLElement, TooltipState>()
let nextId = 0

function isFocusVisible(el: HTMLElement) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

function show(el: HTMLElement, state: TooltipState) {
  clearTimeout(state.hideTimer)
  if (!state.text || state.tip) return
  const tip = document.createElement('div')
  tip.id = `tooltip-${++nextId}`
  tip.setAttribute('role', 'tooltip')
  tip.className =
    'fixed top-0 left-0 z-50 max-w-xs px-2 py-1 rounded text-xs bg-orange-100 text-gray-900 shadow-lg pointer-events-none'
  tip.textContent = state.text
  document.body.append(tip)
  state.tip = tip
  // Screen readers already read the aria-label; describe only when it adds something.
  if (el.getAttribute('aria-label') !== state.text) el.setAttribute('aria-describedby', tip.id)
  state.stopPositioning = autoUpdate(el, tip, () => {
    void computePosition(el, tip, {
      strategy: 'fixed',
      placement: 'top',
      middleware: [offset(6), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
    })
  })
}

function hide(el: HTMLElement, state: TooltipState) {
  clearTimeout(state.pressTimer)
  clearTimeout(state.hideTimer)
  state.stopPositioning?.()
  state.stopPositioning = null
  state.tip?.remove()
  state.tip = null
  el.removeAttribute('aria-describedby')
}

export const vTooltip: Directive<HTMLElement, string | null | undefined> = {
  mounted(el, { value }) {
    const state: TooltipState = {
      text: value ?? '',
      tip: null,
      stopPositioning: null,
      pressTimer: undefined,
      hideTimer: undefined,
      suppressClick: false,
      listeners: [],
    }
    states.set(el, state)

    const on = (
      type: keyof HTMLElementEventMap,
      listener: EventListener,
      options?: AddEventListenerOptions,
    ) => {
      el.addEventListener(type, listener, options)
      state.listeners.push([type, listener, options])
    }

    on('pointerenter', (event) => {
      if ((event as PointerEvent).pointerType === 'mouse') show(el, state)
    })
    on('pointerleave', (event) => {
      if ((event as PointerEvent).pointerType === 'mouse') hide(el, state)
    })
    on('focusin', () => {
      if (isFocusVisible(el)) show(el, state)
    })
    on('focusout', () => {
      hide(el, state)
    })
    on('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Escape' && state.tip) hide(el, state)
    })

    // Touch: a long press shows the label without triggering the button.
    on('pointerdown', (event) => {
      if ((event as PointerEvent).pointerType !== 'touch') return
      state.suppressClick = false
      state.pressTimer = setTimeout(() => {
        state.suppressClick = true
        show(el, state)
        state.hideTimer = setTimeout(() => {
          hide(el, state)
        }, TOUCH_VISIBLE_MS)
      }, LONG_PRESS_MS)
    })
    const cancelPress = () => {
      clearTimeout(state.pressTimer)
    }
    on('pointerup', cancelPress)
    on('pointercancel', cancelPress)
    on('contextmenu', (event) => {
      if (state.suppressClick) event.preventDefault()
    })
    on(
      'click',
      (event) => {
        if (!state.suppressClick) return
        state.suppressClick = false
        event.preventDefault()
        event.stopImmediatePropagation()
      },
      { capture: true },
    )
  },

  updated(el, { value }) {
    const state = states.get(el)
    if (!state) return
    state.text = value ?? ''
    if (!state.tip) return
    if (state.text) state.tip.textContent = state.text
    else hide(el, state)
  },

  beforeUnmount(el) {
    const state = states.get(el)
    if (!state) return
    hide(el, state)
    for (const [type, listener, options] of state.listeners) {
      el.removeEventListener(type, listener, options)
    }
    states.delete(el)
  },
}
