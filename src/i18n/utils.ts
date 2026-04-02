import {
  defaultLang,
  type Locale,
  type TranslationKey,
  ui,
} from './ui'

export function getLangFromUrl(url: URL): Locale {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const pathname = base ? url.pathname.slice(base.length) : url.pathname
  const [, lang] = pathname.split('/')

  if (lang in ui) {
    return lang as Locale
  }

  return defaultLang
}

export function useTranslations(lang: Locale) {
  return function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let str: string = ui[lang][key] ?? ui[defaultLang][key]

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v))
      }
    }

    return str
  }
}
