import type { ListingCardDto } from '@/server/mappers'
import { cn } from '@/lib/utils'
import { ListingCard } from './listing-card'

export function ListingGrid({
  listings,
  favoriteIds,
  className,
  columns = 3,
  mobileLimit,
}: {
  listings: ListingCardDto[]
  favoriteIds?: Set<string>
  className?: string
  columns?: 3 | 4
  /**
   * Telefonda kartalar bir ustunda tizilgani uchun roʻyxat juda choziladi.
   * Bu chegaradan keyingilari faqat kengroq ekranda koʻrsatiladi.
   */
  mobileLimit?: number
}) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 sm:gap-4',
        columns === 4 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3',
        className,
      )}
    >
      {listings.map((listing, i) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          favorited={favoriteIds?.has(listing.id)}
          priority={i < 2}
          className={
            mobileLimit !== undefined && i >= mobileLimit ? 'hidden sm:block' : undefined
          }
        />
      ))}
    </div>
  )
}
