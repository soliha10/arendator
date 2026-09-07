import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/jwt'

/**
 * Tez tekshiruv: cookie'dagi JWT imzosini so'rov qatlamida tekshiradi.
 * Bazaga murojaat qilmaydi — chuqurroq tekshiruv (bloklanganmi,
 * tokenVersion mos keladimi) sahifa ichidagi `requireUser()` da bajariladi.
 */
const PROTECTED = ['/kabinet']
const ADMIN_ONLY = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p))
  const needsAdmin = ADMIN_ONLY.some((p) => pathname.startsWith(p))
  if (!needsAuth && !needsAdmin) return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  if (!session) {
    const url = new URL('/kirish', request.url)
    url.searchParams.set('next', pathname + request.nextUrl.search)
    const response = NextResponse.redirect(url)
    // Yaroqsiz cookie'ni tozalaymiz
    if (token) response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  if (needsAdmin && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/kabinet', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/kabinet/:path*', '/admin/:path*'],
}
