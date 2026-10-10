import 'server-only'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER,
  isLocale, localizeHref, splitLocale, type Locale,
} from './config'
import { messagesFor } from './messages'

/**
 * Server Action, Route Handler va umumiy server kodida til —
 * proxy so'rovga qo'ygan sarlavhadan (root-params bu yerda ishlamaydi).
 */
export async function getRequestLocale(): Promise<Locale> {
  const h = await headers()
  const value = h.get(LOCALE_HEADER)
  if (isLocale(value)) return value

  // /api/* proxy'dan o'tmaydi — so'rov yuborilgan sahifa manzilidan olamiz
  const referer = h.get('referer')
  if (referer) {
    try {
      return splitLocale(new URL(referer).pathname).locale
    } catch {
      // noto'g'ri referer — keyingi usulga o'tamiz
    }
  }
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(cookie) ? cookie : DEFAULT_LOCALE
}

export async function getRequestMessages() {
  return messagesFor(await getRequestLocale())
}

/** Til prefiksini saqlagan holda redirect: localeRedirect('/kirish') */
export async function localeRedirect(path: string): Promise<never> {
  redirect(localizeHref(path, await getRequestLocale()))
}
