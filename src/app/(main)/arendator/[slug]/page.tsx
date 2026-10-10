import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AtSign, Building2, Clock, Globe, MapPin, Phone,
  Send, ShieldCheck, Star,
} from 'lucide-react'
import { getArendatorBySlug } from '@/server/profiles'
import { prisma } from '@/lib/prisma'
import { LISTING_CARD_SELECT, toListingCardDto } from '@/server/mappers'
import { getFavoriteIds } from '@/server/actions/favorites'
import { formatDateLong, formatPhone, formatRelative } from '@/lib/format'
import { ListingGrid } from '@/components/listing/listing-grid'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty'

export async function generateMetadata(
  props: PageProps<'/arendator/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params
  const profile = await getArendatorBySlug(slug)
  if (!profile) return { title: 'Arendator topilmadi' }
  return {
    title: profile.companyName,
    description:
      profile.about?.slice(0, 160) ??
      `${profile.companyName} — avtomobil rassrochka va arendasi.`,
  }
}

export default async function ArendatorPage(props: PageProps<'/arendator/[slug]'>) {
  const { slug } = await props.params
  const profile = await getArendatorBySlug(slug)
  if (!profile) notFound()

  const [rows, favoriteIds] = await Promise.all([
    prisma.listing.findMany({
      where: { ownerId: profile.ownerId, status: 'ACTIVE' },
      select: LISTING_CARD_SELECT,
      orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
    }),
    getFavoriteIds(),
  ])
  const listings = rows.map(toListingCardDto)

  const contacts = [
    profile.phone
      ? { icon: Phone, label: formatPhone(profile.phone), href: `tel:${profile.phone}` }
      : null,
    profile.telegram
      ? {
          icon: Send,
          label: `@${profile.telegram}`,
          href: `https://t.me/${profile.telegram}`,
        }
      : null,
    profile.instagram
      ? {
          icon: AtSign,
          label: `@${profile.instagram}`,
          href: `https://instagram.com/${profile.instagram}`,
        }
      : null,
    profile.website
      ? { icon: Globe, label: profile.website.replace(/^https?:\/\//, ''), href: profile.website }
      : null,
  ].filter((c): c is { icon: typeof Phone; label: string; href: string } => c !== null)

  return (
    <div className="container-page py-6">
      {/* Sarlavha */}
      <div className="card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-xl font-bold text-primary">
            {profile.companyName.slice(0, 2).toUpperCase()}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
                {profile.companyName}
              </h1>
              {profile.isVerified ? (
                <Badge variant="success">
                  <ShieldCheck /> Tasdiqlangan
                </Badge>
              ) : null}
            </div>

            {profile.legalName ? (
              <p className="mt-1 text-[13px] text-muted">
                {profile.legalName}
                {profile.inn ? ` · STIR ${profile.inn}` : ''}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
              {profile.ratingAvg > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="size-4 fill-accent text-accent" />
                  <span className="tabular font-semibold text-text">
                    {profile.ratingAvg.toFixed(1)}
                  </span>
                  ({profile.reviewCount} sharh)
                </span>
              ) : null}
              <span className="tabular">{listings.length} ta faol eʼlon</span>
              {profile.regionName ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-subtle" /> {profile.regionName}
                </span>
              ) : null}
              {profile.workingHours ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-subtle" /> {profile.workingHours}
                </span>
              ) : null}
              <span className="text-subtle">
                Platformada {formatDateLong(profile.createdAt)} dan
              </span>
            </div>

            {contacts.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {contacts.map((c) => (
                  <a
                    key={c.href}
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer noopener"
                    className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-border px-3.5 text-[13px] font-medium text-text transition-colors hover:border-primary hover:text-primary"
                  >
                    <c.icon className="size-4" /> {c.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {profile.about ? (
          <p className="mt-5 border-t border-border pt-5 text-[15px] leading-relaxed text-muted">
            {profile.about}
          </p>
        ) : null}

        {profile.address ? (
          <p className="mt-3 inline-flex items-center gap-2 text-[13px] text-muted">
            <MapPin className="size-4 text-subtle" /> {profile.address}
          </p>
        ) : null}
      </div>

      {/* E'lonlar */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-text">
          Eʼlonlar{' '}
          <span className="tabular text-base font-normal text-muted">
            ({listings.length})
          </span>
        </h2>
        {listings.length > 0 ? (
          <ListingGrid listings={listings} favoriteIds={favoriteIds} columns={4} />
        ) : (
          <EmptyState
            icon={<Building2 />}
            title="Faol eʼlon yoʻq"
            description="Bu arendatorda hozircha chop etilgan eʼlon yoʻq."
          />
        )}
      </section>

      {/* Sharhlar */}
      {profile.reviews.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-text">
            Sharhlar{' '}
            <span className="tabular text-base font-normal text-muted">
              ({profile.reviewCount})
            </span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {profile.reviews.map((review) => (
              <li key={review.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-text">
                    {review.authorName}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={
                          i < review.rating
                            ? 'size-3.5 fill-accent text-accent'
                            : 'size-3.5 text-subtle'
                        }
                      />
                    ))}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">
                    {review.comment}
                  </p>
                ) : null}
                <p className="mt-2 text-[12px] text-subtle">
                  {formatRelative(review.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-10 text-[12px] leading-relaxed text-subtle">
        Arendator taqdim etgan maʼlumotlar uning masʼuliyatida. Shartnoma
        imzolashdan oldin hujjatlarni tekshiring.{' '}
        <Link href="/aloqa" className="text-primary hover:underline">
          Shikoyat bildirish
        </Link>
      </p>
    </div>
  )
}
