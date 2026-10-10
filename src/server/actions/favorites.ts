'use server'

import { revalidateLocalized } from '@/i18n/revalidate'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/guards'

export interface FavoriteResult {
  ok: boolean
  favorited?: boolean
  requiresAuth?: boolean
  error?: string
}

/** Sevimlilarga qo'shish/olib tashlash */
export async function toggleFavoriteAction(
  listingId: string,
): Promise<FavoriteResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, requiresAuth: true }

  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } },
      select: { id: true },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.favorite.delete({ where: { id: existing.id } }),
        prisma.listing.update({
          where: { id: listingId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ])
      revalidateLocalized('/kabinet/saqlanganlar')
      return { ok: true, favorited: false }
    }

    await prisma.$transaction([
      prisma.favorite.create({ data: { userId: user.id, listingId } }),
      prisma.listing.update({
        where: { id: listingId },
        data: { favoriteCount: { increment: 1 } },
      }),
    ])
    revalidateLocalized('/kabinet/saqlanganlar')
    return { ok: true, favorited: true }
  } catch (error) {
    console.error('toggleFavoriteAction:', error)
    return { ok: false, error: 'Amalni bajarib boʻlmadi' }
  }
}

/** Joriy foydalanuvchining sevimli e'lonlari id'lari */
export async function getFavoriteIds(): Promise<Set<string>> {
  const user = await getCurrentUser()
  if (!user) return new Set()
  const rows = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { listingId: true },
  })
  return new Set(rows.map((r) => r.listingId))
}
