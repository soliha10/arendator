import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/jwt'
import {
  DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER,
  isLocale, localizeHref, splitLocale,
} from '@/i18n/config'

/**
 * 1) Til: o'zbekcha URL prefikssiz (/elonlar), ichkarida /uz/elonlar ga
 *    rewrite qilinadi; /ru/... va /en/... o'zicha o'tadi. Til so'rov
 *    sarlavhasiga qo'yiladi — Server Action'lar shundan o'qiydi.
 * 2) Tez avtorizatsiya: cookie'dagi JWT imzosini tekshiradi. Bazaga
 *    murojaat qilmaydi — chuqurroq tekshiruv `requireUser()` da.
 */
const PROTECTED = ['/kabinet']
const ADMIN_ONLY = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // /uz/... — kanonik manzil prefikssiz, dublikat sahifa bo'lmasin
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/'
    return NextResponse.redirect(url, 308)
  }

  const { locale: urlLocale, path } = splitLocale(pathname)

  // Avval tanlangan til eslab qolinadi: prefikssiz sahifaga kirganda
  // ruscha/inglizcha tanlagan foydalanuvchi o'z tiliga qaytariladi
  const remembered = request.cookies.get(LOCALE_COOKIE)?.value
  if (
    urlLocale === DEFAULT_LOCALE &&
    isLocale(remembered) &&
    remembered !== DEFAULT_LOCALE &&
    request.method === 'GET' &&
    !request.headers.has('next-action')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = localizeHref(path, remembered)
    return NextResponse.redirect(url)
  }

  const needsAuth = PROTECTED.some((p) => path.startsWith(p))
  const needsAdmin = ADMIN_ONLY.some((p) => path.startsWith(p))
  if (needsAuth || needsAdmin) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const session = token ? await verifySessionToken(token) : null

    if (!session) {
      const url = new URL(localizeHref('/kirish', urlLocale), request.url)
      url.searchParams.set('next', path + search)
      const response = NextResponse.redirect(url)
      // Yaroqsiz cookie'ni tozalaymiz
      if (token) response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }

    if (needsAdmin && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(localizeHref('/kabinet', urlLocale), request.url))
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_HEADER, urlLocale)

  if (urlLocale === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${path === '/' ? '' : path}`
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // API, Next ichki fayllari va kengaytmali statik fayllar (icon.svg,
  // sitemap.xml, /uploads/*.webp) proxy'dan o'tmaydi
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
