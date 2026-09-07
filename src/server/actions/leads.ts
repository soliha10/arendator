'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getActionUser } from '@/lib/auth/guards'
import { leadSchema, leadStatusSchema } from '@/lib/validation/lead'
import { errorState, fromZodError, successState, type ActionState } from './types'

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
      select: { id: true, status: true, ownerId: true },
    })
    if (!listing || listing.status !== 'ACTIVE') {
      return errorState('Bu eʼlon endi faol emas')
    }
    if (user && user.id === listing.ownerId) {
      return errorState('Oʻz eʼloningizga ariza qoldira olmaysiz')
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
      return errorState(
        'Siz bu eʼlonga yaqinda ariza qoldirgansiz. Arendator tez orada bogʻlanadi.',
      )
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

    revalidatePath('/kabinet/arizalar')
    return successState(
      'Arizangiz yuborildi. Arendator tez orada siz bilan bogʻlanadi.',
    )
  } catch (error) {
    console.error('createLeadAction:', error)
    return errorState('Arizani yuborib boʻlmadi. Qayta urinib koʻring.')
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
      select: { id: true, listing: { select: { ownerId: true } } },
    })
    if (!lead) return errorState('Ariza topilmadi')
    if (lead.listing.ownerId !== user.id && user.role !== 'ADMIN') {
      return errorState('Bu arizani oʻzgartirishga ruxsatingiz yoʻq')
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

    revalidatePath('/kabinet/arizalar')
    return successState('Ariza holati yangilandi')
  } catch (error) {
    console.error('updateLeadStatusAction:', error)
    return errorState('Holatni yangilab boʻlmadi')
  }
}
