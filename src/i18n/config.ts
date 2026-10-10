/**
 * Tillar. O'zbekcha — asosiy, URL'da prefikssiz (/elonlar);
 * qolganlari prefiks bilan (/ru/elonlar, /en/elonlar).
 * Bu fayl server, brauzer va proxy'da ishlaydi — hech narsa import qilmaydi.
 */
export const LOCALES = ['uz', 'ru', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'uz'

/** Tanlangan til shu cookie'da eslab qolinadi */
export const LOCALE_COOKIE = 'NEXT_LOCALE'
/** Proxy so'rovga qo'yadigan sarlavha — Server Action va Route Handler'lar uchun */
export const LOCALE_HEADER = 'x-locale'

export const LOCALE_LABELS: Record<Locale, { short: string; name: string; htmlLang: string; og: string }> = {
  uz: { short: 'UZ', name: 'Oʻzbekcha', htmlLang: 'uz', og: 'uz_UZ' },
  ru: { short: 'RU', name: 'Русский', htmlLang: 'ru', og: 'ru_RU' },
  en: { short: 'EN', name: 'English', htmlLang: 'en', og: 'en_US' },
}

export const isLocale = (v: unknown): v is Locale =>
  typeof v === 'string' && (LOCALES as readonly string[]).includes(v)

/** "/ru/elonlar?x=1" -> { locale: 'ru', path: '/elonlar?x=1' } */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  // Birinchi segment "/", "?" yoki "#" gacha: "/ru?x=1" -> "ru"
  const seg = pathname.slice(1).split(/[/?#]/)[0]
  if (isLocale(seg) && seg !== DEFAULT_LOCALE) {
    const rest = pathname.slice(seg.length + 1)
    return { locale: seg, path: rest === '' ? '/' : rest.startsWith('/') ? rest : `/${rest}` }
  }
  return { locale: DEFAULT_LOCALE, path: pathname }
}

/**
 * Ichki havolaga til prefiksini qo'shadi.
 * Tashqi havola, anchor, mailto/tel o'zgarmaydi.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  // Allaqachon prefiksli bo'lsa — qayta qo'shmaymiz
  const { path } = splitLocale(href)
  if (locale === DEFAULT_LOCALE) return path
  // "/" va "/?x=1" -> "/ru", "/ru?x=1" (ortiqcha slash 308 redirect beradi)
  if (path === '/' || path.startsWith('/?') || path.startsWith('/#')) return `/${locale}${path.slice(1)}`
  return `/${locale}${path}`
}

/** Joriy sahifaning boshqa tildagi manzili (til almashtirgich uchun) */
export function switchLocaleHref(currentPathWithQuery: string, target: Locale): string {
  const { path } = splitLocale(currentPathWithQuery)
  return localizeHref(path, target)
}
