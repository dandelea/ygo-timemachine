import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

function loadLocaleMessages() {
  const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })
  return messages
}

function langCode(code) {
  if (code.includes('_'))
    return code.split('_')[0];
  if (code.includes('-'))
    return code.split('-')[0];
  return code;
}

export default new VueI18n({
  locale: langCode(navigator.language), // en_US => en
  fallbackLocale: 'en',
  messages: loadLocaleMessages(),
})
