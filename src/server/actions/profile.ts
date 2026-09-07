'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getActionUser } from '@/lib/auth/guards'
import { slugify } from '@/lib/utils'
import { arendatorProfileSchema, profileSchema } from '@/lib/validation/auth'
import { errorState, fromZodError, successState, type ActionState } from './types'

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  try {
    const user = await getActionUser()
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email ?? null,
        avatarUrl: parsed.data.avatarUrl || null,
      },
    })
    revalidatePath('/kabinet', 'layout')
    return successState('Profil yangilandi')
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return errorState('Bu email band', { email: ['Bu email boshqa hisobda ishlatilgan'] })
    }
    console.error('updateProfileAction:', error)
    return errorState('Profilni yangilab boʻlmadi')
  }
}

/**
 * Arendator profilini yaratadi yoki yangilaydi.
 * Oddiy foydalanuvchi shu action orqali arendatorga aylanadi.
 */
export async function saveArendatorProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = arendatorProfileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  const data = parsed.data

  try {
    const user = await getActionUser()
    const existing = await prisma.arendatorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })

    const payload = {
      companyName: data.companyName,
      legalName: data.legalName || null,
      inn: data.inn || null,
      about: data.about || null,
      address: data.address || null,
      regionId: data.regionId || null,
      website: data.website || null,
      telegram: data.telegram?.replace(/^@/, '') || null,
      instagram: data.instagram?.replace(/^@/, '') || null,
      workingHours: data.workingHours || null,
      logoUrl: data.logoUrl || null,
    }

    if (existing) {
      await prisma.arendatorProfile.update({ where: { id: existing.id }, data: payload })
    } else {
      // Yangi profil + rolni oshirish
      await prisma.$transaction([
        prisma.arendatorProfile.create({
          data: {
            ...payload,
            userId: user.id,
            slug: `${slugify(data.companyName) || 'arendator'}-${Date.now().toString(36).slice(-4)}`,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { role: user.role === 'ADMIN' ? 'ADMIN' : 'ARENDATOR' },
        }),
      ])
    }

    revalidatePath('/kabinet', 'layout')
    revalidatePath('/arendatorlar')
    return successState(
      existing ? 'Kompaniya maʼlumotlari yangilandi' : 'Arendator profili yaratildi',
    )
  } catch (error) {
    console.error('saveArendatorProfileAction:', error)
    return errorState('Maʼlumotlarni saqlab boʻlmadi')
  }
}
