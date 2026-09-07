import type { ListingCardDto } from '@/server/mappers'
import { cn } from '@/lib/utils'
import { ListingCard } from './listing-card'

export function ListingGrid({
  listings,
  favoriteIds,
  className,
  columns = 3,
}: {
  listings: ListingCardDto[]
  favoriteIds?: Set<string>
  className?: string
  columns?: 3 | 4
}) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2',
        columns === 4 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3',
        className,
      )}
    >
      {listings.map((listing, i) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          favorited={favoriteIds?.has(listing.id)}
          priority={i < 4}
        />
      ))}
    </div>
  )
}
