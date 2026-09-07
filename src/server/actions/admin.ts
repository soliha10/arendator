'use server'

import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getActionUserWithRole } from '@/lib/auth/guards'
import { moderationSchema } from '@/lib/validation/listing'
import { recalcProfileCounters } from '@/server/plan-service'
import { LISTING_ACTIVE_DAYS } from '@/lib/constants'
import { errorState, fromZodError, successState, type ActionState } from './types'

/** Har bir admin amali jurnalga yoziladi */
async function writeAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  meta?: Prisma.InputJsonValue,
) {
  await prisma.auditLog
    .create({ data: { actorId, action, entityType, entityId, meta } })
    .catch(() => {})
}

export async function moderateListingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = moderationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  const { listingId, action, reason } = parsed.data

  try {
    const admin = await getActionUserWithRole(['ADMIN'])
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true, publishedAt: true, title: true },
    })
    if (!listing) return errorState('Eʼlon topilmadi')

    if (action === 'approve') {
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'ACTIVE',
          rejectReason: null,
          publishedAt: listing.publishedAt ?? new Date(),
          expiresAt: new Date(Date.now() + LISTING_ACTIVE_DAYS * 86_400_000),
        },
      })
    } else {
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'REJECTED', rejectReason: reason ?? null },
      })
    }

    await recalcProfileCounters(prisma, listing.ownerId)
    await writeAudit(admin.id, `listing.${action}`, 'Listing', listingId, {
      title: listing.title,
      reason: reason ?? null,
    })

    revalidatePath('/admin/moderatsiya')
    revalidatePath('/elonlar')
    return successState(
      action === 'approve' ? 'Eʼlon tasdiqlandi va chop etildi' : 'Eʼlon rad etildi',
    )
  } catch (error) {
    console.error('moderateListingAction:', error)
    return errorState('Amalni bajarib boʻlmadi')
  }
}

export async function toggleProfileVerificationAction(
  profileId: string,
): Promise<ActionState> {
  try {
    const admin = await getActionUserWithRole(['ADMIN'])
    const profile = await prisma.arendatorProfile.findUnique({
      where: { id: profileId },
      select: { id: true, isVerified: true, companyName: true },
    })
    if (!profile) return errorState('Profil topilmadi')

    const next = !profile.isVerified
    await prisma.arendatorProfile.update({
      where: { id: profileId },
      data: { isVerified: next, verifiedAt: next ? new Date() : null },
    })

    await writeAudit(
      admin.id,
      next ? 'profile.verify' : 'profile.unverify',
      'ArendatorProfile',
      profileId,
      { companyName: profile.companyName },
    )

    revalidatePath('/admin/arendatorlar')
    revalidatePath('/arendatorlar')
    return successState(
      next ? 'Arendator tasdiqlandi' : 'Tasdiq bekor qilindi',
    )
  } catch (error) {
    console.error('toggleProfileVerificationAction:', error)
    return errorState('Amalni bajarib boʻlmadi')
  }
}

export async function toggleUserBlockAction(userId: string): Promise<ActionState> {
  try {
    const admin = await getActionUserWithRole(['ADMIN'])
    if (admin.id === userId) return errorState('Oʻzingizni bloklay olmaysiz')

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isBlocked: true, role: true, fullName: true },
    })
    if (!user) return errorState('Foydalanuvchi topilmadi')
    if (user.role === 'ADMIN') return errorState('Administratorni bloklab boʻlmaydi')

    const next = !user.isBlocked
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: next,
        // Bloklanganda barcha sessiyalari bekor qilinadi
        ...(next ? { tokenVersion: { increment: 1 } } : {}),
      },
    })

    await writeAudit(admin.id, next ? 'user.block' : 'user.unblock', 'User', userId, {
      fullName: user.fullName,
    })

    revalidatePath('/admin/foydalanuvchilar')
    return successState(next ? 'Foydalanuvchi bloklandi' : 'Blok olib tashlandi')
  } catch (error) {
    console.error('toggleUserBlockAction:', error)
    return errorState('Amalni bajarib boʻlmadi')
  }
}

/** Valyuta kursini yangilash */
export async function updateExchangeRateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = formData.get('usdRate')
  const rate = Number(String(raw ?? '').replace(/[\s ]/g, ''))
  if (!Number.isFinite(rate) || rate <= 0) {
    return errorState('Kurs musbat son boʻlishi kerak', { usdRate: ['Notoʻgʻri qiymat'] })
  }

  try {
    const admin = await getActionUserWithRole(['ADMIN'])
    await prisma.exchangeRate.upsert({
      where: { currency: 'USD' },
      create: { currency: 'USD', rateToUzs: rate },
      update: { rateToUzs: rate },
    })
    await writeAudit(admin.id, 'rate.update', 'ExchangeRate', 'USD', { rate })

    revalidatePath('/admin')
    return successState(
      'Kurs yangilandi. Yangi eʼlonlar shu kurs boʻyicha hisoblanadi.',
    )
  } catch (error) {
    console.error('updateExchangeRateAction:', error)
    return errorState('Kursni yangilab boʻlmadi')
  }
}
