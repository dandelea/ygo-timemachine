import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { vTooltip } from '@/directives/tooltip'

const Host = defineComponent({
  directives: { tooltip: vTooltip },
  props: { label: { type: String, default: 'Clear deck' } },
  emits: ['press'],
  template: `<button v-tooltip="label" aria-label="Trash" @click="$emit('press')">x</button>`,
})

const tooltip = () => document.querySelector('[role="tooltip"]')

function mountHost(props = {}) {
  return mount(Host, { props, attachTo: document.body })
}

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('v-tooltip', () => {
  it('shows on mouse hover and hides on leave', async () => {
    const wrapper = mountHost()
    await wrapper.trigger('pointerenter', { pointerType: 'mouse' })
    expect(tooltip()?.textContent).toBe('Clear deck')
    expect(wrapper.attributes('aria-describedby')).toBe(tooltip()?.id)
    await wrapper.trigger('pointerleave', { pointerType: 'mouse' })
    expect(tooltip()).toBeNull()
    expect(wrapper.attributes('aria-describedby')).toBeUndefined()
  })

  it('shows on keyboard focus and hides with Escape', async () => {
    const wrapper = mountHost()
    ;(wrapper.element as HTMLElement).focus()
    expect(tooltip()).not.toBeNull()
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(tooltip()).toBeNull()
  })

  it('shows after a long press on touch screens without pressing the button', async () => {
    vi.useFakeTimers()
    const wrapper = mountHost()
    await wrapper.trigger('pointerdown', { pointerType: 'touch' })
    vi.advanceTimersByTime(500)
    expect(tooltip()).not.toBeNull()
    await wrapper.trigger('pointerup', { pointerType: 'touch' })
    await wrapper.trigger('click')
    expect(wrapper.emitted('press')).toBeUndefined()
    vi.advanceTimersByTime(2000)
    expect(tooltip()).toBeNull()

    // A normal tap still presses the button.
    await wrapper.trigger('pointerdown', { pointerType: 'touch' })
    await wrapper.trigger('pointerup', { pointerType: 'touch' })
    await wrapper.trigger('click')
    expect(wrapper.emitted('press')).toHaveLength(1)
    expect(tooltip()).toBeNull()
  })

  it('follows text changes and cleans up when unmounted', async () => {
    const wrapper = mountHost()
    await wrapper.trigger('pointerenter', { pointerType: 'mouse' })
    await wrapper.setProps({ label: 'Remove all cards' })
    expect(tooltip()?.textContent).toBe('Remove all cards')
    wrapper.unmount()
    expect(tooltip()).toBeNull()
  })

  it('does not describe the element when the text repeats its label', async () => {
    const label = ref('Trash')
    const wrapper = mountHost({ label: label.value })
    await wrapper.trigger('pointerenter', { pointerType: 'mouse' })
    expect(wrapper.attributes('aria-describedby')).toBeUndefined()
  })
})
