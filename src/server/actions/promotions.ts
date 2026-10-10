'use server'

import { revalidateLocalized } from '@/i18n/revalidate'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getActionUser, getActionUserWithRole } from '@/lib/auth/guards'
import { PROMOTION_PLANS } from '@/lib/constants'
import { notify } from '@/server/notifications'
import { errorState, successState, type ActionState } from './types'
import { getRequestMessages } from '@/i18n/action'
import { fmt } from '@/i18n/format'

/** Javob matnlari foydalanuvchi tilida */
const msg = async () => (await getRequestMessages()).server

/**
 * VIP / TOP so'rovi. To'lov tizimi (Click/Payme) ulanguncha so'rov
 * admin paneliga tushadi: admin to'lovni tasdiqlab, muddatni yoqadi.
 */
export async function requestPromotionAction(
  listingId: string,
  tier: 'VIP' | 'TOP',
): Promise<ActionState> {
  const plan = PROMOTION_PLANS.find((p) => p.tier === tier)
  if (!plan) return errorState((await msg()).promotion.invalidPlan)

  try {
    const user = await getActionUser()
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true, status: true },
    })
    if (!listing || (listing.ownerId !== user.id && user.role !== 'ADMIN')) {
      return errorState((await msg()).errors.listingNotFound)
    }
    if (listing.status !== 'ACTIVE') {
      return errorState((await msg()).promotion.onlyActive)
    }

    const pending = await prisma.promotionRequest.findFirst({
      where: { listingId, status: 'PENDING' },
      select: { id: true },
    })
    if (pending) return successState((await msg()).promotion.pending)

    await prisma.promotionRequest.create({
      data: { listingId, userId: user.id, tier, days: plan.days },
    })
    revalidateLocalized('/kabinet/elonlarim')
    revalidateLocalized('/admin')
    const m = await getRequestMessages()
    return successState(fmt(m.server.promotion.requested, { title: m.enums.promotion[tier].title }))
  } catch (error) {
    console.error('requestPromotionAction:', error)
    return errorState((await msg()).promotion.requestFailed)
  }
}

const resolveSchema = z.object({
  requestId: z.string().min(1),
  approve: z.boolean(),
})

/** Admin: so'rovni tasdiqlaydi (muddat yoqiladi) yoki rad etadi */
export async function resolvePromotionAction(
  requestId: string,
  approve: boolean,
): Promise<ActionState> {
  const parsed = resolveSchema.safeParse({ requestId, approve })
  if (!parsed.success) return errorState((await msg()).errors.invalidRequest)

  try {
    await getActionUserWithRole(['ADMIN'])
    const req = await prisma.promotionRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true, tier: true, days: true, status: true, userId: true,
        listing: { select: { id: true, slug: true, title: true, promotedUntil: true } },
      },
    })
    if (!req || req.status !== 'PENDING') return errorState((await msg()).promotion.notFound)

    await prisma.$transaction(async (tx) => {
      await tx.promotionRequest.update({
        where: { id: req.id },
        data: { status: approve ? 'APPROVED' : 'REJECTED', resolvedAt: new Date() },
      })
      if (approve) {
        // Faol muddat bo'lsa, ustiga qo'shiladi
        const base =
          req.listing.promotedUntil && req.listing.promotedUntil > new Date()
            ? req.listing.promotedUntil
            : new Date()
        await tx.listing.update({
          where: { id: req.listing.id },
          data: {
            promotion: req.tier,
            promotedUntil: new Date(base.getTime() + req.days * 86_400_000),
          },
        })
      }
      await notify(tx, {
        userId: req.userId,
        type: 'SYSTEM',
        title: approve ? `${req.tier} paketi faollashtirildi` : `${req.tier} soʻrovi rad etildi`,
        body: approve
          ? `“${req.listing.title}” ${req.days} kun davomida yuqorida koʻrsatiladi.`
          : `“${req.listing.title}” boʻyicha soʻrov tasdiqlanmadi.`,
        link: `/elon/${req.listing.slug}`,
        listingId: req.listing.id,
        data: {
          tpl: approve ? 'promotionApproved' : 'promotionRejected',
          vars: { tier: req.tier, days: req.days, listing: req.listing.title },
        },
      })
    })

    revalidateLocalized('/admin')
    revalidateLocalized('/elonlar')
    revalidateLocalized('/')
    return successState(approve ? (await msg()).promotion.approved : (await msg()).promotion.rejected)
  } catch (error) {
    console.error('resolvePromotionAction:', error)
    return errorState((await msg()).errors.generic)
  }
}
