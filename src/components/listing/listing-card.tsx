'use client'

import Image from 'next/image'
import { Camera, MapPin, ShieldCheck } from 'lucide-react'
import type { ListingCardDto } from '@/server/mappers'
import { currencyLabel, formatMileage, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CompareButton, FavoriteButton } from './listing-actions'
import { CallButton } from './call-button'
import { Link, useLocale, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'
import type { Messages } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'


/** Rasm ustidagi yorliqlar — eng muhim ikkitasi */
function cardBadges(l: ListingCardDto, m: Messages, locale: Locale): { label: string; tone: 'green' | 'blue' | 'orange' | 'light' }[] {
  const out: { label: string; tone: 'green' | 'blue' | 'orange' | 'light' }[] = []
  const t = m.common.card
  if (l.promotion === 'TOP') out.push({ label: t.top, tone: 'orange' })
  if (l.previousPriceUzs && l.displayPriceUzs && l.previousPriceUzs > l.displayPriceUzs) {
    out.push({
      label: fmt(t.priceDropped, {
        amount: formatMoney(l.previousPriceUzs - l.displayPriceUzs, 'UZS', { compact: true, withSuffix: false, locale }),
      }),
      tone: 'green',
    })
  }
  if (l.condition === 'NEW') out.push({ label: t.newZeroKm, tone: 'green' })
  if (l.installment && l.installment.markupPercent === 0) out.push({ label: t.installmentZero, tone: 'blue' })
  if (l.fuelType === 'ELECTRIC' || l.fuelType === 'HYBRID') {
    out.push({ label: m.enums.fuelType[l.fuelType], tone: 'light' })
  }
  if (l.rent?.ownershipTransfer) out.push({ label: t.rentToOwn, tone: 'light' })
  else if (l.rent) out.push({ label: t.rentAvailable, tone: 'blue' })
  return out.slice(0, 2)
}

const BADGE_TONE = {
  green: 'bg-success text-white',
  blue: 'bg-primary text-primary-fg',
  orange: 'bg-[#f97316] text-white',
  light: 'bg-white/90 text-[#0b1c30]',
}

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
  const m = useMessages()
  const locale = useLocale()
  const t = m.common.card
  const money = (v: number) => formatMoney(v, 'UZS', { locale })
  const href = `/elon/${listing.slug}`
  const l = listing
  const badges = cardBadges(l, m, locale)
  const finance = l.installment ?? l.leasing
  const priceDropped =
    l.previousPriceUzs !== null && l.displayPriceUzs !== null && l.previousPriceUzs > l.displayPriceUzs

  const specs = [
    fmt(t.yearSuffix, { year: l.year }),
    m.enums.transmission[l.transmission],
    m.enums.fuelType[l.fuelType],
    formatMileage(l.mileage, locale),
  ]

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-surface transition-shadow hover:surface-shadow',
        l.promotion === 'VIP' ? 'border-primary/60 ring-1 ring-primary/40' : 'border-border',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        <Link href={href} aria-label={l.title} tabIndex={-1}>
          {l.coverImage ? (
            <Image
              src={l.coverImage.url}
              alt={l.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              placeholder={l.coverImage.blurDataUrl ? 'blur' : undefined}
              blurDataURL={l.coverImage.blurDataUrl ?? undefined}
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-subtle">
              <Camera className="size-8" />
            </div>
          )}
        </Link>

        {badges.length > 0 ? (
          <div className="pointer-events-none absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b.label}
                className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold shadow-sm', BADGE_TONE[b.tone])}
              >
                {b.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <FavoriteButton listingId={l.id} initialFavorited={favorited} />
          <CompareButton
            item={{ id: l.id, slug: l.slug, title: l.title, imageUrl: l.coverImage?.url ?? null }}
          />
        </div>

        {l.imageCount > 1 ? (
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Camera className="size-3" /> {l.imageCount}
          </span>
        ) : null}
        {l.promotion === 'VIP' ? (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-fg">
            {t.vip}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} className="min-w-0">
            <h3 className="line-clamp-2x text-[16px] font-bold leading-snug text-text transition-colors group-hover:text-primary">
              {l.title}
            </h3>
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted">
            <MapPin className="size-3" aria-hidden />
            <span className="max-w-24 truncate">{regionLabel(m, l.regionSlug, l.regionName)}</span>
          </span>
        </div>
        <p className="mt-1 text-[12px] text-muted">{specs.join(' • ')}</p>

        <div className="mt-3 space-y-2">
          {l.displayPriceUzs !== null ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2.5">
              <span className="text-[12px] font-medium text-muted">
                {l.hasCashSale ? t.cashPrice : t.carPrice}
                {l.isNegotiable ? <span className="block text-[10px] text-subtle">{t.negotiable}</span> : null}
              </span>
              <span className="text-right">
                {priceDropped ? (
                  <span className="tabular block text-[11px] text-subtle line-through">
                    {money(l.previousPriceUzs!)}
                  </span>
                ) : null}
                <span className="font-display tabular whitespace-nowrap text-[17px] font-extrabold text-text">
                  {money(l.displayPriceUzs)}
                </span>
              </span>
            </div>
          ) : null}

          {l.rent ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2.5">
              <span className="text-[12px] font-medium text-muted">{t.rent}</span>
              <span className="text-right">
                <span className="tabular block whitespace-nowrap text-[13px] font-bold text-text">
                  {l.rent.dailyUzs
                    ? fmt(t.perDay, { amount: money(l.rent.dailyUzs) })
                    : fmt(t.perMonth, { amount: money(l.rent.monthlyUzs) })}
                </span>
                {l.rent.dailyUzs ? (
                  <span className="tabular block whitespace-nowrap text-[11px] text-subtle">
                    {fmt(t.orPerMonth, { amount: money(l.rent.monthlyUzs) })}
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}

          {finance ? (
            <div className="rounded-lg border border-primary/20 bg-primary-soft/60 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-primary">
                  {finance.planType === 'LEASING' ? t.leasing : t.installment}
                </span>
                <span className="text-[12px] font-semibold text-text">{fmt(t.forMonths, { n: finance.termMonths })}</span>
              </div>
              <div className="mt-1.5 flex items-end justify-between gap-2">
                <span className="text-[11px] leading-snug text-muted">
                  {t.downPayment}{' '}
                  <span className="tabular font-semibold text-text">
                    {formatMoney(finance.downUzs, 'UZS', { compact: true, locale })}
                  </span>{' '}
                  ({finance.downPercent}%)
                </span>
                <span className="text-right">
                  <span className="font-display tabular block whitespace-nowrap text-[18px] font-extrabold leading-none text-primary">
                    {formatMoney(finance.monthlyUzs, 'UZS', { withSuffix: false, locale })}
                  </span>
                  <span className="text-[11px] font-medium text-primary">{fmt(t.perMonthUnit, { currency: currencyLabel('UZS', locale) })}</span>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          <div className="grid grid-cols-[1.2fr_1fr] gap-2">
            <Link
              href={href}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
            >
              {t.details}
            </Link>
            <CallButton listingId={l.id} />
          </div>
          <p className="mt-2.5 flex items-center gap-1 truncate text-[11px] text-subtle">
            {l.ownerVerified ? (
              <ShieldCheck className="size-3.5 shrink-0 text-success" aria-label={t.verifiedDealer} />
            ) : null}
            <span className="truncate">{l.ownerName}</span>
          </p>
        </div>
      </div>
    </article>
  )
}
