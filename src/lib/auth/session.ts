import 'server-only'
import { cookies } from 'next/headers'
import type { Role } from '@prisma/client'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySessionToken,
  type SessionPayload,
} from './jwt'

export { SESSION_COOKIE_NAME, verifySessionToken }
export type { SessionPayload }

/** Cookie oʻrnatadi — faqat Server Action yoki Route Handler ichida chaqiring */
export async function createSessionCookie(payload: {
  sub: string
  role: Role
  tv: number
  name: string
}): Promise<void> {
  const token = await signSession(payload)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Sessiyani cookie'dan oʻqiydi. Bazaga murojaat qilmaydi —
 * shu sabab tez, lekin faqat koʻrsatish/navigatsiya uchun ishonchli.
 * Maʼlumot oʻzgartiruvchi amallarda `requireUser()` dan foydalaning.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}
