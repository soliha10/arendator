'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
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

/** Ochiq yo'naltirish (open redirect) hujumidan himoya */
function safeNext(next: string | undefined | null): string {
  if (!next) return '/kabinet'
  if (!next.startsWith('/') || next.startsWith('//')) return '/kabinet'
  return next
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  const { fullName, phone, email, password, role, companyName } = parsed.data

  try {
    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        email,
        passwordHash,
        role,
        ...(role === 'ARENDATOR' && companyName
          ? {
              profile: {
                create: {
                  companyName,
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
        return errorState('Bu email allaqachon roʻyxatdan oʻtgan', {
          email: ['Bu email band'],
        })
      }
      return errorState('Bu telefon raqami allaqachon roʻyxatdan oʻtgan', {
        phone: ['Bu raqam band'],
      })
    }
    console.error('registerAction:', error)
    return errorState('Roʻyxatdan oʻtishda xatolik yuz berdi. Qayta urinib koʻring.')
  }

  redirect(role === 'ARENDATOR' ? '/kabinet/elonlarim' : '/kabinet')
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
      return errorState('Telefon raqami yoki parol notoʻgʻri')
    }
    if (user.isBlocked) {
      return errorState('Hisobingiz bloklangan. Qoʻllab-quvvatlash xizmatiga murojaat qiling.')
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return errorState('Telefon raqami yoki parol notoʻgʻri')

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
    return errorState('Kirishda xatolik yuz berdi. Qayta urinib koʻring.')
  }

  redirect(destination)
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie()
  revalidatePath('/', 'layout')
  redirect('/')
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
      return errorState('Joriy parol notoʻgʻri', {
        currentPassword: ['Parol notoʻgʻri'],
      })
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

    return successState('Parol yangilandi. Boshqa qurilmalardagi sessiyalar bekor qilindi.')
  } catch (error) {
    if (isFrameworkError(error)) throw error
    console.error('changePasswordAction:', error)
    return errorState('Parolni yangilab boʻlmadi')
  }
}
