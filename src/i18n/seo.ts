import { LOCALES, LOCALE_LABELS, localizeHref, type Locale } from './config'

/**
 * Har bir sahifa metadata'si uchun: kanonik manzil (joriy tilda) va
 * boshqa tillardagi muqobillar (hreflang). Google va Yandex ruscha
 * qidiruvga ruscha sahifani, o'zbekchaga o'zbekchasini ko'rsatadi.
 *   alternates: alternatesFor('/elonlar', locale)
 */
export function alternatesFor(path: string, locale: Locale) {
  const languages: Record<string, string> = {}
  for (const l of LOCALES) languages[LOCALE_LABELS[l].htmlLang] = localizeHref(path, l)
  languages['x-default'] = localizeHref(path, 'uz')
  return { canonical: localizeHref(path, locale), languages }
}

export const ogLocale = (locale: Locale) => LOCALE_LABELS[locale].og
export const ogAlternateLocales = (locale: Locale) =>
  LOCALES.filter((l) => l !== locale).map((l) => LOCALE_LABELS[l].og)
