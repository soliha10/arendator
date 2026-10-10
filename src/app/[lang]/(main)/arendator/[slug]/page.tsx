import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  AtSign, Building2, CalendarDays, CarFront, Clock, ExternalLink, Globe,
  KeyRound, MapPin, MessageSquareText, Phone, Send, ShieldCheck, Star,
} from 'lucide-react'
import { getArendatorBySlug } from '@/server/profiles'
import { prisma } from '@/lib/prisma'
import { LISTING_CARD_SELECT, toListingCardDto } from '@/server/mappers'
import { getFavoriteIds } from '@/server/actions/favorites'
import { formatDateLong, formatPhone, formatRelative } from '@/lib/format'
import { SITE, telegramUrl } from '@/lib/site'
import { ListingGrid } from '@/components/listing/listing-grid'
import { DealerAvatar } from '@/components/dealer/dealer-avatar'
import { EmptyState } from '@/components/ui/empty'
import { Link } from '@/i18n/client'
import { fmt, plural } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'
import { LOCALE_LABELS, localizeHref } from '@/i18n/config'
import { alternatesFor, ogLocale } from '@/i18n/seo'
import { getLocale, getMessages } from '@/i18n/server'

export async function generateMetadata(
  props: PageProps<'/[lang]/arendator/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params
  const [profile, m, locale] = await Promise.all([getArendatorBySlug(slug), getMessages(), getLocale()])
  const t = m.dealers.profile
  if (!profile) return { title: t.notFound }
  const description =
    profile.about?.slice(0, 160) ??
    fmt(t.metaDescription, { name: profile.companyName, n: profile.listingCount })
  return {
    title: fmt(t.metaTitle, { name: profile.companyName }),
    description,
    alternates: alternatesFor(`/arendator/${slug}`, locale),
    openGraph: { title: profile.companyName, description, type: 'profile', locale: ogLocale(locale) },
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={i < rating ? 'size-3.5 fill-[#f59e0b] text-[#f59e0b]' : 'size-3.5 text-subtle'}
          aria-hidden
        />
      ))}
    </span>
  )
}

export default async function DealerPage(props: PageProps<'/[lang]/arendator/[slug]'>) {
  const { slug } = await props.params
  const profile = await getArendatorBySlug(slug)
  if (!profile) notFound()

  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.dealers.profile
  const tc = m.dealers.card
  const regionName = profile.regionName
    ? regionLabel(m, profile.regionSlug, profile.regionName)
    : null

  const [rows, favoriteIds] = await Promise.all([
    prisma.listing.findMany({
      where: { ownerId: profile.ownerId, status: 'ACTIVE' },
      select: LISTING_CARD_SELECT,
      orderBy: [{ promotion: 'desc' }, { publishedAt: { sort: 'desc', nulls: 'last' } }],
    }),
    getFavoriteIds(),
  ])
  const listings = rows.map(toListingCardDto)

  const contacts = [
    profile.phone
      ? { icon: Phone, label: formatPhone(profile.phone), href: `tel:${profile.phone}`, primary: true }
      : null,
    profile.telegram
      ? { icon: Send, label: `@${profile.telegram.replace(/^@/, '')}`, href: telegramUrl(profile.telegram), primary: false }
      : null,
    profile.instagram
      ? { icon: AtSign, label: `@${profile.instagram}`, href: `https://instagram.com/${profile.instagram}`, primary: false }
      : null,
    profile.website
      ? { icon: Globe, label: profile.website.replace(/^https?:\/\//, ''), href: profile.website, primary: false }
      : null,
  ].filter((c) => c !== null)

  const stats = [
    { icon: CarFront, label: t.statActive, value: String(listings.length) },
    { icon: KeyRound, label: t.statRented, value: String(profile.rentedCount) },
    {
      icon: Star,
      label: t.statRating,
      value: profile.reviewCount > 0 ? `${profile.ratingAvg.toFixed(1)} / 5` : '—',
    },
    { icon: CalendarDays, label: t.statSince, value: formatDateLong(profile.createdAt, locale) },
  ]

  const mapHref =
    profile.latitude !== null && profile.longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${profile.latitude}&mlon=${profile.longitude}#map=16/${profile.latitude}/${profile.longitude}`
      : null

  // Qidiruv tizimlari uchun tuzilgan ma'lumot (schema.org/AutoDealer)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: profile.companyName,
    url: `${SITE.url}${localizeHref(`/arendator/${profile.slug}`, locale)}`,
    inLanguage: LOCALE_LABELS[locale].htmlLang,
    ...(profile.logoUrl ? { logo: profile.logoUrl, image: profile.logoUrl } : {}),
    ...(profile.about ? { description: profile.about } : {}),
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.address || profile.regionName
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: profile.address ?? undefined,
            addressRegion: regionName ?? undefined,
            addressCountry: 'UZ',
          },
        }
      : {}),
    ...(profile.latitude !== null && profile.longitude !== null
      ? { geo: { '@type': 'GeoCoordinates', latitude: profile.latitude, longitude: profile.longitude } }
      : {}),
    ...(profile.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: profile.ratingAvg,
            reviewCount: profile.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
  }

  return (
    <div className="container-page py-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-muted">
        <Link href="/" className="hover:text-text">{m.dealers.breadcrumb.home}</Link>
        <span className="mx-1.5 text-subtle">›</span>
        <Link href="/dilerlar" className="hover:text-text">{m.dealers.breadcrumb.dealersShort}</Link>
        <span className="mx-1.5 text-subtle">›</span>
        <span className="text-text">{profile.companyName}</span>
      </nav>

      {/* Sarlavha kartasi */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4 sm:gap-5">
            <DealerAvatar
              name={profile.companyName}
              logoUrl={profile.logoUrl}
              verified={profile.isVerified}
              verifiedLabel={tc.verified}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-extrabold leading-tight text-text sm:text-[30px]">
                  {profile.companyName}
                </h1>
                {profile.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-[12px] font-semibold text-success">
                    <ShieldCheck className="size-3.5" aria-hidden /> {tc.verified}
                  </span>
                ) : null}
              </div>
              {profile.legalName ? (
                <p className="mt-1 text-[13px] text-muted">
                  {profile.legalName}
                  {profile.inn ? ` · ${fmt(t.taxId, { inn: profile.inn })}` : ''}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">
                {profile.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="size-4 fill-[#f59e0b] text-[#f59e0b]" aria-hidden />
                    <span className="tabular font-semibold text-text">{profile.ratingAvg.toFixed(1)}</span>
                    {plural(locale, profile.reviewCount, tc.reviews)}
                  </span>
                ) : null}
                {regionName ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-subtle" aria-hidden /> {regionName}
                  </span>
                ) : null}
                {profile.workingHours ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-subtle" aria-hidden /> {profile.workingHours}
                  </span>
                ) : null}
              </div>
              {profile.tags.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {profile.tags.map((t) => (
                    <li key={t}>
                      <Link
                        href={`/dilerlar?tag=${encodeURIComponent(t)}`}
                        className="inline-block rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-muted hover:text-text"
                      >
                        {t}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {contacts.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-64 lg:flex-col">
              {contacts.map((c) => (
                <a
                  key={c.href}
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer noopener"
                  className={
                    c.primary
                      ? 'tabular inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover'
                      : 'inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-soft px-4 text-sm font-semibold text-primary transition-colors hover:brightness-95'
                  }
                >
                  <c.icon className="size-4" aria-hidden /> {c.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <s.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <dt className="truncate text-[11px] text-muted">{s.label}</dt>
                <dd className="font-display tabular truncate text-[15px] font-bold text-text">{s.value}</dd>
              </span>
            </div>
          ))}
        </dl>

        {profile.about || profile.address ? (
          <div className="mt-5 grid gap-4 border-t border-border pt-5 lg:grid-cols-[1fr_auto] lg:items-start">
            {profile.about ? (
              <p className="max-w-3xl text-[15px] leading-relaxed text-muted">{profile.about}</p>
            ) : (
              <span />
            )}
            {profile.address ? (
              <p className="inline-flex items-start gap-2 text-[13px] text-text">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  {profile.address}
                  {mapHref ? (
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                    >
                      {t.openMap} <ExternalLink className="size-3" aria-hidden />
                    </a>
                  ) : null}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* E'lonlar */}
      <section className="mt-8" aria-labelledby="listings-title">
        <h2 id="listings-title" className="mb-4 text-[20px] font-bold text-text">
          {t.listingsTitle}{' '}
          <span className="tabular text-primary">({listings.length})</span>
        </h2>
        {listings.length > 0 ? (
          <ListingGrid listings={listings} favoriteIds={favoriteIds} />
        ) : (
          <EmptyState
            icon={<Building2 />}
            title={t.noListingsTitle}
            description={t.noListingsText}
          />
        )}
      </section>

      {/* Sharhlar */}
      <section className="mt-10" aria-labelledby="reviews-title">
        <h2 id="reviews-title" className="mb-4 text-[20px] font-bold text-text">
          {t.reviewsTitle}{' '}
          <span className="tabular text-primary">({profile.reviewCount})</span>
        </h2>
        {profile.reviews.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-text">{review.authorName}</span>
                  <Stars rating={review.rating} />
                </div>
                {review.comment ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{review.comment}</p>
                ) : null}
                <p className="mt-2 text-[12px] text-subtle">{formatRelative(review.createdAt, locale)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<MessageSquareText />}
            title={t.noReviewsTitle}
            description={t.noReviewsText}
          />
        )}
      </section>

      <p className="mt-10 text-[12px] leading-relaxed text-subtle">
        {t.disclaimer}{' '}
        <Link href="/aloqa" className="text-primary hover:underline">
          {t.report}
        </Link>
      </p>
    </div>
  )
}
