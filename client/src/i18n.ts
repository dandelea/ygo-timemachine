import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import es from './locales/es.json'

export type MessageSchema = typeof en

/** `en-US` → `en`; falls back to English for unsupported languages. */
export function languageOf(code: string): 'en' | 'es' {
  const language = code.split(/[-_]/)[0]
  return language === 'es' ? 'es' : 'en'
}

export const i18n = createI18n<[MessageSchema], 'en' | 'es'>({
  legacy: false,
  locale: languageOf(navigator.language),
  fallbackLocale: 'en',
  messages: { en, es },
})
