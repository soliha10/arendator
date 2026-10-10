'use server'

import { revalidateLocalized } from '@/i18n/revalidate'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getActionUser } from '@/lib/auth/guards'
import { leadSchema, leadStatusSchema } from '@/lib/validation/lead'
import { notify } from '@/server/notifications'
import { LEAD_STATUS_LABELS } from '@/lib/constants'
import { errorState, fromZodError, successState, type ActionState } from './types'
import { getRequestMessages } from '@/i18n/action'

/** Javob matnlari foydalanuvchi tilida */
const msg = async () => (await getRequestMessages()).server

/** Foydalanuvchi e'lon bo'yicha ariza qoldiradi */
export async function createLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  const { listingId, planId, fullName, phone, message } = parsed.data

  try {
    const user = await getCurrentUser()

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, ownerId: true, title: true },
    })
    if (!listing || listing.status !== 'ACTIVE') {
      return errorState((await msg()).errors.listingInactive)
    }
    if (user && user.id === listing.ownerId) {
      return errorState((await msg()).lead.ownListing)
    }

    // Spam himoyasi: bir raqamdan bir e'longa 1 soatda 1 marta
    const recent = await prisma.lead.findFirst({
      where: {
        listingId,
        phone,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      select: { id: true },
    })
    if (recent) {
      return errorState((await msg()).lead.duplicate)
    }

    await prisma.$transaction([
      prisma.lead.create({
        data: {
          listingId,
          planId: planId || null,
          userId: user?.id ?? null,
          fullName,
          phone,
          message: message || null,
        },
      }),
      prisma.listing.update({
        where: { id: listingId },
        data: { leadCount: { increment: 1 } },
      }),
    ])

    await notify(prisma, {
      userId: listing.ownerId,
      type: 'LEAD_NEW',
      title: 'Eʼloningiz boʻyicha yangi xaridor arizasi!',
      body: `${fullName} “${listing.title}” eʼloningizga ariza qoldirdi.`,
      link: '/kabinet/arizalar',
      listingId,
      data: { tpl: 'leadNew', vars: { name: fullName, listing: listing.title }, phone },
    })

    revalidateLocalized('/kabinet/arizalar')
    return successState((await msg()).lead.sent)
  } catch (error) {
    console.error('createLeadAction:', error)
    return errorState((await msg()).lead.sendFailed)
  }
}

/** Arendator ariza holatini o'zgartiradi */
export async function updateLeadStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = leadStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  try {
    const user = await getActionUser()
    const lead = await prisma.lead.findUnique({
      where: { id: parsed.data.leadId },
      select: {
        id: true,
        userId: true,
        listing: { select: { id: true, ownerId: true, title: true, slug: true } },
      },
    })
    if (!lead) return errorState((await msg()).lead.notFound)
    if (lead.listing.ownerId !== user.id && user.role !== 'ADMIN') {
      return errorState((await msg()).lead.noRights)
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: parsed.data.status,
        ownerNote: parsed.data.ownerNote || null,
        contactedAt:
          parsed.data.status === 'CONTACTED' ? new Date() : undefined,
      },
    })

    // Ro'yxatdan o'tgan xaridorga arizasi holati haqida xabar
    if (lead.userId && ['CONTACTED', 'APPROVED', 'REJECTED'].includes(parsed.data.status)) {
      await notify(prisma, {
        userId: lead.userId,
        type: 'LEAD_STATUS',
        title: `Arizangiz holati: ${LEAD_STATUS_LABELS[parsed.data.status]}`,
        body: `“${lead.listing.title}” boʻyicha arizangiz koʻrib chiqildi.`,
        link: `/elon/${lead.listing.slug}`,
        listingId: lead.listing.id,
        data: { tpl: 'leadStatus', vars: { listing: lead.listing.title }, status: parsed.data.status },
      })
    }

    revalidateLocalized('/kabinet/arizalar')
    return successState((await msg()).lead.statusUpdated)
  } catch (error) {
    console.error('updateLeadStatusAction:', error)
    return errorState((await msg()).lead.statusFailed)
  }
}
