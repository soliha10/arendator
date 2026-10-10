import Image from 'next/image'
import { ChevronRight, Clock, MapPin, Phone, ShieldCheck, Star } from 'lucide-react'
import type { DealerCardDto } from '@/server/profiles'
import type { ListingCardDto } from '@/server/mappers'
import { formatMoney, formatPhone } from '@/lib/format'
import { Link } from '@/i18n/client'
import type { Locale } from '@/i18n/config'
import { fmt, plural } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'
import type { Messages } from '@/i18n/messages'
import { getLocale, getMessages } from '@/i18n/server'
import { DealerAvatar } from './dealer-avatar'

/** Mini kartada ko'rsatiladigan eng foydali narx qatori */
function previewPrice(l: ListingCardDto, m: Messages, locale: Locale): { main: string; sub: string } {
  const t = m.dealers.card
  const money = (v: number) => formatMoney(v, 'UZS', { locale })
  const fin = l.installment ?? l.leasing
  if (fin) {
    return {
      main: fmt(t.perMonth, { amount: money(fin.monthlyUzs) }),
      sub: fmt(t.downShort, { n: fin.downPercent, year: l.year }),
    }
  }
  if (l.rent) {
    return {
      main: l.rent.dailyUzs
        ? fmt(t.perDay, { amount: money(l.rent.dailyUzs) })
        : fmt(t.perMonth, { amount: money(l.rent.monthlyUzs) }),
      sub: fmt(t.rentShort, { year: l.year }),
    }
  }
  return {
    main: l.displayPriceUzs ? money(l.displayPriceUzs) : '—',
    sub: fmt(t.cashShort, { year: l.year }),
  }
}

function PreviewCard({ listing, m, locale }: { listing: ListingCardDto; m: Messages; locale: Locale }) {
  const price = previewPrice(listing, m, locale)
  return (
    <Link
      href={`/elon/${listing.slug}`}
      className="group flex items-center gap-3 rounded-lg bg-surface-2 p-2 transition-colors hover:bg-surface-3"
    >
      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-surface-3">
        {listing.coverImage ? (
          <Image
            src={listing.coverImage.url}
            alt={listing.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-text group-hover:text-primary">
          {listing.title}
        </span>
        <span className="tabular block truncate text-[12px] font-semibold text-primary">
          {price.main}
        </span>
        <span className="block truncate text-[11px] text-muted">{price.sub}</span>
      </span>
    </Link>
  )
}

export async function DealerCard({ dealer }: { dealer: DealerCardDto }) {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.dealers.card
  const href = `/arendator/${dealer.slug}`
  return (
    <article className="rounded-xl border border-border bg-surface p-4 transition-shadow hover:surface-shadow sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <DealerAvatar
            name={dealer.companyName}
            logoUrl={dealer.logoUrl}
            verified={dealer.isVerified}
            verifiedLabel={t.verified}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-[18px] font-bold leading-tight text-text">
                <Link href={href} className="hover:text-primary">
                  {dealer.companyName}
                </Link>
              </h3>
              {dealer.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                  <ShieldCheck className="size-3.5" aria-hidden /> {t.verified}
                </span>
              ) : null}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
              {dealer.reviewCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" aria-hidden />
                  <span className="tabular font-semibold text-text">{dealer.ratingAvg.toFixed(1)}</span>
                  {plural(locale, dealer.reviewCount, t.reviews)}
                </span>
              ) : (
                <span>{t.noReviews}</span>
              )}
              <span className="tabular">{plural(locale, dealer.listingCount, t.activeListings)}</span>
              {dealer.address || dealer.regionName ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin className="size-3.5 shrink-0 text-subtle" aria-hidden />
                  <span className="truncate">
                    {dealer.address ?? regionLabel(m, dealer.regionSlug, dealer.regionName ?? '')}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {dealer.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 md:max-w-[40%] md:justify-end">
            {dealer.tags.slice(0, 4).map((t) => (
              <li
                key={t}
                className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {dealer.previews.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {fmt(t.available, { n: dealer.listingCount })}
            </p>
            <Link href={href} className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-primary hover:underline">
              {t.all} <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dealer.previews.map((l) => (
              <PreviewCard key={l.id} listing={l} m={m} locale={locale} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-1.5 text-[12px] text-muted">
          <Clock className="size-3.5 text-subtle" aria-hidden />
          {dealer.workingHours ?? t.noHours}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <a
            href={`tel:${dealer.phone}`}
            className="tabular inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary-soft px-3 text-[13px] font-semibold text-primary transition-colors hover:brightness-95"
          >
            <Phone className="size-4 shrink-0" aria-hidden />
            <span className="sm:hidden">{t.call}</span>
            <span className="hidden truncate sm:inline">{formatPhone(dealer.phone)}</span>
          </a>
          <Link
            href={href}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
          >
            <span className="truncate">{fmt(t.cars, { n: dealer.listingCount })}</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}
