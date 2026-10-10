'use client'

import * as React from 'react'
import NextLink from 'next/link'
import { usePathname, useRouter as useNextRouter } from 'next/navigation'
import { localizeHref, splitLocale, type Locale } from './config'
import type { Messages } from './messages'
import { translateValidation } from './validation'

interface I18nValue {
  locale: Locale
  messages: Messages
}

const I18nContext = React.createContext<I18nValue | null>(null)

export function I18nProvider({
  locale,
  messages,
  children,
}: I18nValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ locale, messages }), [locale, messages])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18n(): I18nValue {
  const ctx = React.useContext(I18nContext)
  if (!ctx) throw new Error('I18nProvider topilmadi')
  return ctx
}

export const useLocale = () => useI18n().locale
export const useMessages = () => useI18n().messages

/** Ichki havolaga til prefiksini qo'shuvchi funksiya */
export function useHref() {
  const locale = useLocale()
  return React.useCallback((path: string) => localizeHref(path, locale), [locale])
}

/** Validatsiya xabarini joriy tilga o'giradi */
export function useValidationText() {
  const locale = useLocale()
  return React.useCallback((msg: string | undefined) => (msg ? translateValidation(msg, locale) : msg), [locale])
}

/** URL'dagi til prefiksisiz yo'l: /ru/elonlar -> /elonlar (faol menyuni aniqlash uchun) */
export function usePathnameWithoutLocale(): string {
  return splitLocale(usePathname()).path
}

/**
 * next/link o'rniga: `href` avtomatik joriy tilga moslanadi.
 * Faqat string href qo'llab-quvvatlanadi (loyihada boshqasi ishlatilmaydi).
 */
export const Link = React.forwardRef<
  HTMLAnchorElement,
  Omit<React.ComponentProps<typeof NextLink>, 'href'> & { href: string }
>(function LocaleLink({ href, ...props }, ref) {
  const locale = useLocale()
  return <NextLink ref={ref} href={localizeHref(href, locale)} {...props} />
})

/** next/navigation useRouter o'rniga: push/replace/prefetch til prefiksi bilan */
export function useRouter() {
  const router = useNextRouter()
  const locale = useLocale()
  return React.useMemo(
    () => ({
      ...router,
      push: (href: string, opts?: Parameters<typeof router.push>[1]) =>
        router.push(localizeHref(href, locale), opts),
      replace: (href: string, opts?: Parameters<typeof router.replace>[1]) =>
        router.replace(localizeHref(href, locale), opts),
      prefetch: (href: string) => router.prefetch(localizeHref(href, locale)),
    }),
    [router, locale],
  )
}
