import {
  defaultLang,
  type Locale,
  type TranslationKey,
  ui,
} from './ui'

export function useI18n(locale?: Locale | string) {
  const lang = (locale && locale in ui ? locale : defaultLang) as Locale

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let str: string = ui[lang][key] ?? ui[defaultLang][key]

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v))
      }
    }

    return str
  }

  return { t }
}
