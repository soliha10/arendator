import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Camera, Gauge, MapPin, ShieldCheck } from 'lucide-react'
import type { ListingCardDto } from '@/server/mappers'
import { Badge } from '@/components/ui/badge'
import { TRANSMISSION_LABELS } from '@/lib/constants'
import { formatMileage, formatMoney, formatRelative, formatTerm } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CompareButton, FavoriteButton } from './listing-actions'

export function ListingCard({
  listing,
  favorited = false,
  className,
  priority = false,
}: {
  listing: ListingCardDto
  favorited?: boolean
  className?: string
  priority?: boolean
}) {
  const href = `/elon/${listing.slug}`
  const monthly = listing.minMonthlyPaymentUzs
  const down = listing.minDownPaymentUzs

  const termLabel =
    listing.minTermMonths && listing.maxTermMonths
      ? listing.minTermMonths === listing.maxTermMonths
        ? formatTerm(listing.minTermMonths)
        : `${listing.minTermMonths}–${listing.maxTermMonths} oy`
      : null

  return (
    <article
      className={cn(
        'group card overflow-hidden transition-shadow hover:surface-shadow',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        <Link href={href} aria-label={listing.title}>
          {listing.coverImage ? (
            <Image
              src={listing.coverImage.url}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              placeholder={listing.coverImage.blurDataUrl ? 'blur' : undefined}
              blurDataURL={listing.coverImage.blurDataUrl ?? undefined}
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-subtle">
              <Camera className="size-8" />
            </div>
          )}
        </Link>

        {/* Yuqori chap: statuslar */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {listing.isFeatured ? (
            <Badge variant="solid" size="sm" className="bg-accent text-black">
              TOP
            </Badge>
          ) : null}
          {listing.condition === 'NEW' ? (
            <Badge variant="success" size="sm">
              Yangi
            </Badge>
          ) : null}
          {listing.hasRent && !listing.hasInstallment ? (
            <Badge variant="dark" size="sm">
              Arenda
            </Badge>
          ) : null}
        </div>

        {/* Yuqori o'ng: amallar */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <FavoriteButton listingId={listing.id} initialFavorited={favorited} />
          <CompareButton
            item={{
              id: listing.id,
              slug: listing.slug,
              title: listing.title,
              imageUrl: listing.coverImage?.url ?? null,
            }}
          />
        </div>

        {/* Pastki o'ng: rasm soni */}
        {listing.imageCount > 1 ? (
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Camera className="size-3" /> {listing.imageCount}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <Link href={href} className="block">
          <h3 className="line-clamp-1x text-[15px] font-semibold text-text transition-colors group-hover:text-primary">
            {listing.title}
          </h3>
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5 text-subtle" /> {listing.year}
          </span>
          <span className="inline-flex items-center gap-1">
            <Gauge className="size-3.5 text-subtle" /> {formatMileage(listing.mileage)}
          </span>
          <span>{TRANSMISSION_LABELS[listing.transmission]}</span>
        </div>

        {/* Asosiy raqamlar — kartaning yuragi */}
        <div className="mt-3.5 rounded-xl bg-surface-2 p-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                Oyiga, soʻm
              </p>
              <p className="tabular mt-0.5 whitespace-nowrap text-[19px] font-bold leading-tight text-text">
                {monthly
                  ? formatMoney(monthly, 'UZS', { compact: true, withSuffix: false })
                  : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                Boshlangʻich
              </p>
              <p className="tabular mt-0.5 whitespace-nowrap text-[15px] font-semibold leading-tight text-text">
                {down !== null
                  ? formatMoney(down, 'UZS', { compact: true, withSuffix: false })
                  : '—'}
              </p>
            </div>
          </div>
          {termLabel ? (
            <p className="mt-2 border-t border-border pt-2 text-[12px] text-muted">
              Muddat: <span className="font-medium text-text">{termLabel}</span>
              {listing.carPriceUzs ? (
                <>
                  {' · '}Narxi{' '}
                  <span className="font-medium text-text">
                    {formatMoney(listing.carPriceUzs, 'UZS', { compact: true })}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-[12px] text-subtle">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{listing.regionName}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {listing.ownerVerified ? (
              <span
                className="inline-flex items-center gap-1 text-success"
                title="Tasdiqlangan arendator"
              >
                <ShieldCheck className="size-3.5" />
              </span>
            ) : null}
            {formatRelative(listing.publishedAt)}
          </span>
        </div>
      </div>
    </article>
  )
}
