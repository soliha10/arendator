import { lang } from 'next/root-params'
import { DEFAULT_LOCALE, isLocale, localizeHref, type Locale } from './config'
import { messagesFor } from './messages'

/**
 * Server Component'lar uchun joriy til — URL'dagi [lang] segmentidan.
 * (Server Action va Route Handler'larda `@/i18n/action` ishlatiladi.)
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang()
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export async function getMessages() {
  return messagesFor(await getLocale())
}

/** Server'da ichki havola: href('/elonlar') -> '/ru/elonlar' */
export async function getHref() {
  const locale = await getLocale()
  return (path: string) => localizeHref(path, locale)
}
