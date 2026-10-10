'use server'

import { prisma } from '@/lib/prisma'
import { buildListingWhere } from '@/server/listings'
import { parseListingFilters } from '@/lib/validation/filters'

/**
 * Hero filtri va kalkulyator vidjeti uchun: tanlangan shartlarga mos
 * faol e'lonlar soni. Faqat o'qiydi — ochiq ma'lumot.
 */
export async function countListingsAction(query: string): Promise<number> {
  const params = Object.fromEntries(new URLSearchParams(query.slice(0, 1000)))
  const filters = parseListingFilters(params)
  return prisma.listing.count({ where: buildListingWhere(filters) })
}
