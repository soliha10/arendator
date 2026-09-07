'use server'

import { getListingsForCompare } from '@/server/listings'
import type { ListingDetailDto } from '@/server/mappers'
import { MAX_COMPARE_ITEMS } from '@/lib/constants'

/**
 * Taqqoslash ro'yxati brauzerda (localStorage) saqlanadi,
 * shuning uchun ma'lumot shu action orqali olinadi.
 */
export async function fetchCompareListings(
  ids: string[],
): Promise<ListingDetailDto[]> {
  const clean = [...new Set(ids)]
    .filter((id) => typeof id === 'string' && id.length > 0 && id.length < 64)
    .slice(0, MAX_COMPARE_ITEMS)
  if (clean.length === 0) return []
  return getListingsForCompare(clean)
}
