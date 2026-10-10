'use server'

import { revalidateLocalized } from '@/i18n/revalidate'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getActionUserWithRole } from '@/lib/auth/guards'
import { moderationSchema } from '@/lib/validation/listing'
import { recalcProfileCounters } from '@/server/plan-service'
import { matchSavedSearches, notify } from '@/server/notifications'
import { LISTING_ACTIVE_DAYS } from '@/lib/constants'
import { errorState, fromZodError, successState, type ActionState } from './types'
import { getRequestMessages } from '@/i18n/action'

/** Javob matnlari foydalanuvchi tilida */
const msg = async () => (await getRequestMessages()).server

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
      select: { id: true, ownerId: true, publishedAt: true, title: true, slug: true },
    })
    if (!listing) return errorState((await msg()).errors.listingNotFound)

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

    await notify(prisma, {
      userId: listing.ownerId,
      type: 'LISTING_STATUS',
      title:
        action === 'approve'
          ? 'Eʼloningiz tasdiqlandi va chop etildi'
          : 'Eʼloningiz rad etildi',
      body:
        action === 'approve'
          ? `${listing.title} endi katalogda koʻrinadi.`
          : `${listing.title}: ${reason ?? 'sabab koʻrsatilmagan'}. Tahrirlab qayta yuboring.`,
      link: action === 'approve' ? `/elon/${listing.slug}` : `/kabinet/elon/${listing.id}/tahrirlash`,
      listingId: listing.id,
      data: {
        tpl: action === 'approve' ? 'listingApproved' : 'listingRejected',
        vars: { listing: listing.title, reason: reason ?? '' },
      },
    })
    // Saqlangan qidiruvlar bo'yicha xabar — javobni kutmaymiz
    if (action === 'approve') {
      void matchSavedSearches(listing.id).catch((e) => console.error('matchSavedSearches:', e))
    }

    await recalcProfileCounters(prisma, listing.ownerId)
    await writeAudit(admin.id, `listing.${action}`, 'Listing', listingId, {
      title: listing.title,
      reason: reason ?? null,
    })

    revalidateLocalized('/admin/moderatsiya')
    revalidateLocalized('/elonlar')
    return successState(
      action === 'approve' ? (await msg()).moderation.approved : (await msg()).moderation.rejected,
    )
  } catch (error) {
    console.error('moderateListingAction:', error)
    return errorState((await msg()).errors.generic)
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
    if (!profile) return errorState((await msg()).admin.profileNotFound)

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

    revalidateLocalized('/admin/arendatorlar')
    revalidateLocalized('/dilerlar')
    return successState(
      next ? (await msg()).admin.dealerVerified : (await msg()).admin.verificationRemoved,
    )
  } catch (error) {
    console.error('toggleProfileVerificationAction:', error)
    return errorState((await msg()).errors.generic)
  }
}

export async function toggleUserBlockAction(userId: string): Promise<ActionState> {
  try {
    const admin = await getActionUserWithRole(['ADMIN'])
    if (admin.id === userId) return errorState((await msg()).admin.cannotBlockSelf)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isBlocked: true, role: true, fullName: true },
    })
    if (!user) return errorState((await msg()).admin.userNotFound)
    if (user.role === 'ADMIN') return errorState((await msg()).admin.cannotBlockAdmin)

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

    revalidateLocalized('/admin/foydalanuvchilar')
    return successState(next ? (await msg()).admin.userBlocked : (await msg()).admin.userUnblocked)
  } catch (error) {
    console.error('toggleUserBlockAction:', error)
    return errorState((await msg()).errors.generic)
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
    return errorState((await msg()).admin.rateInvalid, { usdRate: [(await msg()).admin.valueInvalid] })
  }

  try {
    const admin = await getActionUserWithRole(['ADMIN'])
    await prisma.exchangeRate.upsert({
      where: { currency: 'USD' },
      create: { currency: 'USD', rateToUzs: rate },
      update: { rateToUzs: rate },
    })
    await writeAudit(admin.id, 'rate.update', 'ExchangeRate', 'USD', { rate })

    revalidateLocalized('/admin')
    return successState(
      (await msg()).admin.rateUpdated,
    )
  } catch (error) {
    console.error('updateExchangeRateAction:', error)
    return errorState((await msg()).admin.rateFailed)
  }
}
