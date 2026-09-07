import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { LISTING_CARD_SELECT, toListingCardDto } from '@/server/mappers'
import { ListingGrid } from '@/components/listing/listing-grid'
import { EmptyState } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Saqlanganlar' }

export default async function FavoritesPage() {
  const user = await requireUser('/kabinet/saqlanganlar')

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { listing: { select: LISTING_CARD_SELECT } },
  })

  const listings = favorites.map((f) => toListingCardDto(f.listing))
  const favoriteIds = new Set(listings.map((l) => l.id))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Saqlanganlar</h1>
        <p className="mt-1.5 text-sm text-muted">
          <span className="tabular font-medium text-text">{listings.length}</span> ta eʼlon
        </p>
      </div>

      {listings.length > 0 ? (
        <ListingGrid listings={listings} favoriteIds={favoriteIds} />
      ) : (
        <EmptyState
          icon={<Heart />}
          title="Saqlangan eʼlon yoʻq"
          description="Yoqqan avtomobillarni yurak belgisi orqali saqlang — keyin shu yerda topasiz."
          action={
            <Button asChild>
              <Link href="/elonlar">Eʼlonlarni koʻrish</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
