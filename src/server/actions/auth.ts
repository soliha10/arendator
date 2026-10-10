'use server'

import { revalidateLocalized } from '@/i18n/revalidate'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, fakeVerify } from '@/lib/auth/password'
import { createSessionCookie, destroySessionCookie } from '@/lib/auth/session'
import { getActionUser } from '@/lib/auth/guards'
import { slugify } from '@/lib/utils'
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from '@/lib/validation/auth'
import {
  errorState,
  fromZodError,
  successState,
  type ActionState,
} from './types'
import { getRequestMessages, localeRedirect } from '@/i18n/action'
import { splitLocale } from '@/i18n/config'

/** Javob matnlari foydalanuvchi tilida */
const msg = async () => (await getRequestMessages()).auth

/** Redirect/notFound ichki xatolarini yutib yubormaslik uchun */
function isFrameworkError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    ((error as { digest: string }).digest.startsWith('NEXT_REDIRECT') ||
      (error as { digest: string }).digest === 'NEXT_NOT_FOUND')
  )
}

/**
 * Ochiq yo'naltirish (open redirect) hujumidan himoya. `next` til
 * prefiksi bilan ham (/ru/kabinet) kelishi mumkin — prefiks olib
 * tashlanadi, redirect paytida joriy til qayta qo'shiladi.
 */
function safeNext(next: string | undefined | null): string {
  if (!next) return '/kabinet'
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/kabinet'
  return splitLocale(next).path
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  const { fullName, phone, email, password, accountType, companyName, next } = parsed.data
  const role = accountType === 'BUSINESS' ? 'ARENDATOR' : 'USER'

  try {
    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        email,
        passwordHash,
        role,
        accountType,
        ...(accountType === 'BUSINESS' && companyName
          ? {
              profile: {
                create: {
                  companyName,
                  phone,
                  slug: `${slugify(companyName)}-${Date.now().toString(36).slice(-4)}`,
                },
              },
            }
          : {}),
      },
      select: { id: true, role: true, tokenVersion: true, fullName: true },
    })

    await createSessionCookie({
      sub: user.id,
      role: user.role,
      tv: user.tokenVersion,
      name: user.fullName,
    })
  } catch (error) {
    if (isFrameworkError(error)) throw error
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = (error.meta?.target as string[] | undefined)?.[0]
      if (target === 'email') {
        const t = (await msg()).errors
        return errorState(t.emailExists, { email: [t.emailTaken] })
      }
      const t = (await msg()).errors
      return errorState(t.phoneExists, { phone: [t.phoneTaken] })
    }
    console.error('registerAction:', error)
    return errorState((await msg()).errors.registerFailed)
  }

  // `next` bo'lsa (masalan, e'lon berishdan kelgan) — o'sha yerga qaytamiz
  return localeRedirect(next ? safeNext(next) : role === 'ARENDATOR' ? '/kabinet/elonlarim' : '/kabinet')
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  const { phone, password, next } = parsed.data
  let destination = safeNext(next)

  try {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true, passwordHash: true, role: true,
        tokenVersion: true, fullName: true, isBlocked: true,
      },
    })

    if (!user) {
      await fakeVerify() // timing attack'ni oldini olish
      return errorState((await msg()).errors.invalidCredentials)
    }
    if (user.isBlocked) {
      return errorState((await msg()).errors.blocked)
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return errorState((await msg()).errors.invalidCredentials)

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await createSessionCookie({
      sub: user.id,
      role: user.role,
      tv: user.tokenVersion,
      name: user.fullName,
    })

    if (destination === '/kabinet' && user.role === 'ADMIN') destination = '/admin'
  } catch (error) {
    if (isFrameworkError(error)) throw error
    console.error('loginAction:', error)
    return errorState((await msg()).errors.loginFailed)
  }

  return localeRedirect(destination)
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie()
  revalidateLocalized('/', 'layout')
  return localeRedirect('/')
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  try {
    const current = await getActionUser()
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: current.id },
      select: { passwordHash: true },
    })

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
    if (!valid) {
      const t = (await msg()).errors
      return errorState(t.currentPasswordWrong, { currentPassword: [t.passwordWrong] })
    }

    const passwordHash = await hashPassword(parsed.data.newPassword)
    // tokenVersion oshirilishi barcha eski sessiyalarni bekor qiladi
    const updated = await prisma.user.update({
      where: { id: current.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
      select: { id: true, role: true, tokenVersion: true, fullName: true },
    })

    // Joriy qurilmada sessiyani yangilaymiz
    await createSessionCookie({
      sub: updated.id,
      role: updated.role,
      tv: updated.tokenVersion,
      name: updated.fullName,
    })

    return successState((await msg()).passwordChanged)
  } catch (error) {
    if (isFrameworkError(error)) throw error
    console.error('changePasswordAction:', error)
    return errorState((await msg()).errors.passwordFailed)
  }
}
