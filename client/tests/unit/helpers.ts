import { createTestingPinia } from '@pinia/testing'
import { mount, RouterLinkStub, type ComponentMountingOptions } from '@vue/test-utils'
import { vi } from 'vitest'
import type { Component } from 'vue'
import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import { fixtures } from '../fixtures/api'

export { fixtures }

export function testI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

/** Mounts with English messages, stubbed icons/links and a testing Pinia. */
export function mountWithApp<C extends Component>(
  component: C,
  options: ComponentMountingOptions<C> = {},
  { stubActions = false } = {},
) {
  return mount(component, {
    ...options,
    global: {
      plugins: [testI18n(), createTestingPinia({ stubActions, createSpy: vi.fn })],
      stubs: { FontAwesomeIcon: true, RouterLink: RouterLinkStub },
      ...options.global,
    },
  })
}
