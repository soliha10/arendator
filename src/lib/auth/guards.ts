import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { Role, User } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession, destroySessionCookie } from './session'

export class AuthError extends Error {
  constructor(message = 'Avtorizatsiya talab qilinadi') {
    super(message)
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Bu amal uchun ruxsatingiz yoʻq') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export type CurrentUser = Pick<
  User,
  'id' | 'phone' | 'email' | 'fullName' | 'avatarUrl' | 'role' | 'isBlocked' | 'tokenVersion'
>

/**
 * Bazadan haqiqiy foydalanuvchini oladi va tokenVersion / bloklanganlikni
 * tekshiradi. React `cache` tufayli bitta so'rov ichida bir marta bajariladi.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      phone: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      role: true,
      isBlocked: true,
      tokenVersion: true,
    },
  })

  if (!user) return null
  // Parol o'zgargan yoki sessiyalar bekor qilingan
  if (user.tokenVersion !== session.tv) return null
  if (user.isBlocked) return null

  return user
})

/** Kirmagan bo'lsa /kirish ga yo'naltiradi */
export async function requireUser(redirectTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''
    redirect(`/kirish${next}`)
  }
  return user
}

export async function requireRole(
  roles: Role[],
  redirectTo?: string,
): Promise<CurrentUser> {
  const user = await requireUser(redirectTo)
  if (!roles.includes(user.role)) {
    redirect('/kabinet?xato=ruxsat')
  }
  return user
}

export const requireArendator = (redirectTo?: string) =>
  requireRole(['ARENDATOR', 'ADMIN'], redirectTo)

export const requireAdmin = (redirectTo?: string) =>
  requireRole(['ADMIN'], redirectTo)

/**
 * Server Action'lar uchun: redirect qilmaydi, xato qaytaradi.
 * Action'lar natijani `{ ok: false, error }` ko'rinishida qaytarishi kerak.
 */
export async function getActionUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    await destroySessionCookie().catch(() => {})
    throw new AuthError()
  }
  return user
}

export async function getActionUserWithRole(roles: Role[]): Promise<CurrentUser> {
  const user = await getActionUser()
  if (!roles.includes(user.role)) throw new ForbiddenError()
  return user
}
