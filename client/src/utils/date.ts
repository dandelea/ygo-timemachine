import { formatRelative, isValid, parseISO, type Locale } from 'date-fns'
import { enUS, es } from 'date-fns/locale'

const locales: Record<string, Locale> = { en: enUS, es }

export function dateLocale(language: string): Locale {
  return locales[language] ?? enUS
}

/**
 * Calendar-style date ("last Monday at ..." for recent dates, a localized
 * short date otherwise), replacing moment's `calendar()`.
 */
export function formatCalendarDate(value: string | null, language: string): string {
  if (!value) return ''
  const date = parseISO(value)
  return isValid(date) ? formatRelative(date, new Date(), { locale: dateLocale(language) }) : value
}
