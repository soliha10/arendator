import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  BadgeCheck, CalendarDays, Check, ChevronRight, Clock, Eye, Flag, Fuel, Gauge,
  Home, MapPin, Send, Settings2, ShieldAlert, ShieldCheck, Star, TrendingDown,
} from 'lucide-react'
import { getListingBySlug, getSimilarListings, incrementViewCount } from '@/server/listings'
import type { ListingDetailDto } from '@/server/mappers'
import { getCurrentUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { currencyLabel, formatCount, formatMileage, formatMoney, formatRelative } from '@/lib/format'
import { SITE, telegramUrl } from '@/lib/site'
import { Gallery } from '@/components/listing/gallery'
import { PlanViewer } from '@/components/listing/plan-viewer'
import { LeadForm } from '@/components/listing/lead-form'
import { CompareButton, FavoriteButton } from '@/components/listing/listing-actions'
import { MobileCta } from '@/components/listing/mobile-cta'
import { ListingGrid } from '@/components/listing/listing-grid'
import { FinanceWidget } from '@/components/listing/finance-widget'
import { PriceHistory } from '@/components/listing/price-history'
import { ShareButton } from '@/components/listing/share-button'
import { CallButton } from '@/components/listing/call-button'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt, plural } from '@/i18n/format'
import { featureLabel, regionLabel } from '@/i18n/labels'
import { alternatesFor, ogLocale } from '@/i18n/seo'
import { LOCALE_LABELS, localizeHref, type Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/messages'

export const dynamic = 'force-dynamic'

function headline(l: ListingDetailDto, locale: Locale) {
  const monthly = l.installment?.monthlyUzs ?? l.leasing?.monthlyUzs ?? l.rent?.monthlyUzs ?? null
  return {
    monthly: monthly ? formatMoney(monthly, 'UZS', { compact: true, locale }) : null,
    price: l.displayPriceUzs ? formatMoney(l.displayPriceUzs, 'UZS', { compact: true, locale }) : null,
  }
}

export async function generateMetadata(
  props: PageProps<'/[lang]/elon/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params
  const [listing, m, locale] = await Promise.all([getListingBySlug(slug), getMessages(), getLocale()])
  const t = m.listing.meta
  if (!listing) return { title: t.notFound }

  const { monthly, price } = headline(listing, locale)
  const modes = [
    listing.hasInstallment ? t.modeInstallment : null,
    listing.hasRent ? t.modeRent : null,
    listing.hasCashSale ? t.modeCash : null,
  ].filter(Boolean)

  const description = [
    `${listing.title}, ${fmt(t.yearSuffix, { year: listing.year })}, ${formatMileage(listing.mileage, locale)}, ${regionLabel(m, listing.regionSlug, listing.regionName)}.`,
    price ? fmt(t.price, { price }) : null,
    monthly ? fmt(t.monthlyFrom, { monthly }) : null,
    modes.length ? `${modes.join(', ')}.` : null,
    t.tail,
  ]
    .filter(Boolean)
    .join(' ')

  // OG rasm `opengraph-image.tsx` fayl konvensiyasi orqali qo'shiladi
  return {
    title: monthly ? fmt(t.titleMonthly, { title: listing.title, monthly }) : listing.title,
    description: description.slice(0, 200),
    alternates: alternatesFor(`/elon/${listing.slug}`, locale),
    openGraph: {
      title: listing.title,
      description: description.slice(0, 200),
      type: 'website',
      locale: ogLocale(locale),
    },
    robots: listing.status === 'ACTIVE' ? undefined : { index: false, follow: false },
  }
}

/** Google uchun: avtomobil + narx taklifi (rich result) */
function JsonLd({ l, m, locale }: { l: ListingDetailDto; m: Messages; locale: Locale }) {
  const abs = (path: string) => `${SITE.url}${localizeHref(path, locale)}`
  const url = abs(`/elon/${l.slug}`)
  const price = l.cashPriceUzs ?? l.displayPriceUzs
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Car',
      name: l.title,
      url,
      inLanguage: LOCALE_LABELS[locale].htmlLang,
      image: l.images.slice(0, 6).map((i) => (i.url.startsWith('http') ? i.url : `${SITE.url}${i.url}`)),
      description: l.description ?? undefined,
      brand: { '@type': 'Brand', name: l.brandName },
      model: l.modelName,
      vehicleModelDate: String(l.year),
      bodyType: m.enums.bodyType[l.bodyType],
      fuelType: m.enums.fuelType[l.fuelType],
      vehicleTransmission: m.enums.transmission[l.transmission],
      color: l.color ?? undefined,
      itemCondition:
        l.condition === 'NEW' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      mileageFromOdometer: { '@type': 'QuantitativeValue', value: l.mileage, unitCode: 'KMT' },
      ...(l.engineVolume
        ? { vehicleEngine: { '@type': 'EngineSpecification', engineDisplacement: { '@type': 'QuantitativeValue', value: l.engineVolume, unitCode: 'LTR' } } }
        : {}),
      ...(price
        ? {
            offers: {
              '@type': 'Offer',
              url,
              price: Math.round(price),
              priceCurrency: 'UZS',
              availability:
                l.status === 'ACTIVE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              seller: { '@type': l.owner.accountType === 'BUSINESS' ? 'AutoDealer' : 'Person', name: l.ownerName },
            },
          }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: m.listing.breadcrumb.home, item: abs('/') },
        { '@type': 'ListItem', position: 2, name: m.listing.breadcrumb.listings, item: abs('/elonlar') },
        { '@type': 'ListItem', position: 3, name: l.brandName, item: abs(`/elonlar?q=${encodeURIComponent(l.brandName)}`) },
        { '@type': 'ListItem', position: 4, name: l.title, item: url },
      ],
    },
  ]
  return (
    <script
      type="application/ld+json"
      // `<` ni qochiramiz — tavsif ichidagi "</script>" sahifani buzmasin
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

const chip = 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold'

export default async function ListingPage(props: PageProps<'/[lang]/elon/[slug]'>) {
  const { slug } = await props.params
  const [listing, m, locale] = await Promise.all([getListingBySlug(slug), getMessages(), getLocale()])
  if (!listing) notFound()
  const t = m.listing
  const e = m.enums

  const user = await getCurrentUser()
  const isOwner = user?.id === listing.owner.id

  // Faol bo'lmagan e'lonni faqat egasi va admin ko'ra oladi
  if (listing.status !== 'ACTIVE' && !isOwner && user?.role !== 'ADMIN') {
    notFound()
  }

  const [favorited, similar] = await Promise.all([
    user
      ? prisma.favorite
          .findUnique({
            where: { userId_listingId: { userId: user.id, listingId: listing.id } },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
    getSimilarListings(listing, 4),
  ])

  if (!isOwner) void incrementViewCount(listing.id)

  const l = listing
  const telegram = l.telegram ?? l.owner.telegram
  const priceDropped =
    l.previousPriceUzs !== null && l.displayPriceUzs !== null && l.previousPriceUzs > l.displayPriceUzs
  const finance = l.installment ?? l.leasing

  const regionName = regionLabel(m, l.regionSlug, l.regionName)
  const engine = l.engineVolume ? fmt(t.header.engine, { volume: l.engineVolume }) : null
  const s = t.specs
  const highlights = [
    { icon: Gauge, label: s.mileage, value: formatMileage(l.mileage, locale), hint: l.condition === 'NEW' ? s.mileageNew : s.mileageStated },
    { icon: CalendarDays, label: s.year, value: fmt(t.meta.yearSuffix, { year: l.year }), hint: e.condition[l.condition] },
    { icon: Settings2, label: s.transmission, value: e.transmission[l.transmission], hint: fmt(t.header.drive, { drive: e.driveType[l.driveType] }) },
    { icon: Fuel, label: s.fuel, value: e.fuelType[l.fuelType], hint: l.engineVolume ? fmt(s.engineHint, { volume: l.engineVolume }) : '—' },
  ]

  const specRows: [string, string][] = [
    [s.makeModel, `${l.brandName} ${l.modelName}`],
    [s.body, e.bodyType[l.bodyType]],
    [s.engine, engine ?? '—'],
    [s.drive, e.driveTypeLong[l.driveType]],
    [s.color, l.color ?? '—'],
    [s.seats, l.seats ? plural(locale, l.seats, s.seatsValue) : '—'],
    [s.condition, e.condition[l.condition]],
    [
      s.location,
      // Manzil ko'pincha viloyat nomidan boshlanadi — takrorlamaymiz
      !l.address
        ? regionName
        : l.address.startsWith(l.regionName)
          ? regionName + l.address.slice(l.regionName.length)
          : `${regionName}, ${l.address}`,
    ],
  ]

  const ownerInitials = l.ownerName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="container-page py-4 pb-[calc(5rem+var(--safe-b))] sm:py-6 lg:pb-8">
      <JsonLd l={l} m={m} locale={locale} />

      <nav aria-label={t.breadcrumb.aria} className="mb-4 flex flex-wrap items-center gap-1 text-[13px] text-muted">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-text">
          <Home className="size-3.5" aria-hidden /> {t.breadcrumb.home}
        </Link>
        <ChevronRight className="size-3.5 text-subtle" aria-hidden />
        <Link href={`/elonlar?q=${encodeURIComponent(l.brandName)}`} className="hover:text-text">
          {l.brandName}
        </Link>
        <ChevronRight className="size-3.5 text-subtle" aria-hidden />
        <Link href={`/elonlar?q=${encodeURIComponent(l.modelName)}`} className="hover:text-text">
          {l.modelName}
        </Link>
        <ChevronRight className="size-3.5 text-subtle" aria-hidden />
        <span className="text-text">{l.year}</span>
      </nav>

      {l.status !== 'ACTIVE' ? (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          {t.notPublished}
        </div>
      ) : null}

      {/* ── Sarlavha va narx ─────────────────────────────── */}
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {l.ownerVerified ? (
              <span className={`${chip} bg-success-soft text-success`}>
                <BadgeCheck className="size-3.5" aria-hidden /> {t.header.verifiedDealer}
              </span>
            ) : null}
            {l.promotion !== 'NONE' ? (
              <span className={`${chip} bg-[#f97316] text-white`}>{l.promotion === 'TOP' ? m.common.card.top : m.common.card.vip}</span>
            ) : null}
            {l.hasInstallment ? <span className={`${chip} bg-primary-soft text-primary`}>{t.header.installment}</span> : null}
            {l.leasing ? <span className={`${chip} bg-primary-soft text-primary`}>{t.header.leasing}</span> : null}
            {l.hasRent ? <span className={`${chip} bg-primary-soft text-primary`}>{t.header.rent}</span> : null}
            {l.hasCashSale ? <span className={`${chip} bg-surface-2 text-text`}>{t.header.cash}</span> : null}
            {l.publishedAt ? (
              <span className="ml-1 text-[12px] text-muted">
                {fmt(t.header.published, { time: formatRelative(l.publishedAt, locale) })}
              </span>
            ) : null}
          </div>
          <h1 className="mt-2.5 text-[26px] font-extrabold leading-tight text-text sm:text-[34px]">
            {l.title}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            {[
              engine,
              e.fuelType[l.fuelType],
              e.transmission[l.transmission],
              fmt(t.header.drive, { drive: e.driveType[l.driveType] }),
              fmt(t.meta.yearSuffix, { year: l.year }),
            ]
              .filter(Boolean)
              .join(' • ')}
          </p>
        </div>

        {l.displayPriceUzs !== null ? (
          <div className="shrink-0 lg:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {l.hasCashSale ? t.header.cashPrice : t.header.carPrice}
            </p>
            {priceDropped ? (
              <p className="mt-1 flex items-center gap-2 lg:justify-end">
                <span className="tabular text-[14px] text-subtle line-through">
                  {formatMoney(l.previousPriceUzs, 'UZS', { locale })}
                </span>
                <span className={`${chip} bg-success-soft text-success`}>
                  <TrendingDown className="size-3.5" aria-hidden />
                  {fmt(t.header.cheaperBy, { amount: formatMoney(l.previousPriceUzs! - l.displayPriceUzs, 'UZS', { compact: true, locale }) })}
                </span>
              </p>
            ) : null}
            <p className="font-display tabular text-[30px] font-extrabold leading-tight text-primary sm:text-[36px]">
              {formatMoney(l.displayPriceUzs, 'UZS', { withSuffix: false, locale })}
              <span className="ml-1.5 text-[18px] font-semibold text-muted">{currencyLabel('UZS', locale)}</span>
            </p>
            {l.isNegotiable ? <p className="text-[12px] text-muted">{t.header.negotiable}</p> : null}
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
        {/* ── Galereya ───────────────────────────────────── */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="card p-2.5 sm:p-3">
            <Gallery images={l.images} title={l.title} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FavoriteButton listingId={l.id} initialFavorited={favorited} withLabel />
            <CompareButton
              item={{ id: l.id, slug: l.slug, title: l.title, imageUrl: l.images[0]?.url ?? null }}
              withLabel
            />
            <ShareButton
              title={l.title}
              text={headline(l, locale).monthly ? fmt(t.actions.shareText, { monthly: headline(l, locale).monthly! }) : undefined}
              withLabel
            />
            <span className="ml-auto inline-flex items-center gap-3 text-[12px] text-muted">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" aria-hidden /> {formatCount(l.viewCount, locale)}
              </span>
              <span className="tabular">{fmt(t.actions.id, { id: l.id.slice(-6).toUpperCase() })}</span>
            </span>
          </div>
        </div>

        {/* ── O'ng ustun: moliyalashtirish (yopishqoq) ─────── */}
        <aside id="tolov" className="scroll-offset space-y-4 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <FinanceWidget
            listingId={l.id}
            plans={l.plans}
            cash={{
              hasCashSale: l.hasCashSale,
              cashPrice: l.cashPrice,
              cashCurrency: l.cashCurrency,
              isNegotiable: l.isNegotiable,
              cashPriceUzs: l.cashPriceUzs,
              previousPriceUzs: l.previousPriceUzs,
            }}
            telegram={telegram}
            isOwner={isOwner}
          />
          {finance && finance.markupPercent === 0 ? (
            <div className="card flex items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-text">{t.zeroMarkup.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  {t.zeroMarkup.body}
                </p>
              </div>
            </div>
          ) : null}
          {isOwner ? (
            <div className="card p-5 text-center">
              <p className="text-sm text-muted">{t.owner.yours}</p>
              <Link
                href={`/kabinet/elon/${l.id}/tahrirlash`}
                className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
              >
                {t.owner.edit}
              </Link>
            </div>
          ) : null}
        </aside>

        {/* ── Chap ustun davomi ────────────────────────────── */}
        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">
          {/* Texnik xususiyatlar */}
          <section className="card p-5 sm:p-7" aria-labelledby="spec-title">
            <h2 id="spec-title" className="text-[22px] font-bold text-text">
              {s.title}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {highlights.map((h) => (
                <div key={h.label} className="rounded-xl bg-surface-2 p-4">
                  <h.icon className="size-5 text-primary" aria-hidden />
                  <p className="mt-2 text-[12px] font-medium text-muted">{h.label}</p>
                  <p className="font-display mt-0.5 text-[18px] font-bold leading-tight text-text">{h.value}</p>
                  <p className="mt-0.5 text-[12px] font-medium text-primary">{h.hint}</p>
                </div>
              ))}
            </div>
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {specRows.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 rounded-lg bg-surface-2/60 px-4 py-3">
                  <dt className="text-[13px] text-muted">{k}</dt>
                  <dd className="text-right text-[13px] font-medium text-text">{v}</dd>
                </div>
              ))}
            </dl>

            {l.features.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-[15px] font-semibold text-text">{s.features}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {l.features.map((f) => (
                    <li
                      key={f}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-[13px] font-medium text-primary"
                    >
                      <Check className="size-3.5" aria-hidden /> {featureLabel(m, f)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {l.description ? (
              <div className="mt-6">
                <h3 className="text-[15px] font-semibold text-text">{s.description}</h3>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted">
                  {l.description}
                </p>
              </div>
            ) : null}
          </section>

          {/* Diler */}
          <section className="card p-5 sm:p-6" aria-label={t.dealer.aria}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft text-[18px] font-bold text-primary">
                  {l.owner.logoUrl ? (
                    <Image src={l.owner.logoUrl} alt={l.ownerName} fill sizes="64px" className="object-cover" />
                  ) : (
                    ownerInitials
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {l.owner.slug ? (
                      <Link href={`/arendator/${l.owner.slug}`} className="text-[18px] font-bold text-text hover:text-primary">
                        {l.ownerName}
                      </Link>
                    ) : (
                      <p className="text-[18px] font-bold text-text">{l.ownerName}</p>
                    )}
                    {l.owner.isVerified ? (
                      <span className={`${chip} bg-success-soft text-success`}>
                        <ShieldCheck className="size-3.5" aria-hidden /> {t.dealer.official}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                    {l.owner.reviewCount > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" aria-hidden />
                        <span className="tabular font-semibold text-text">{l.owner.ratingAvg.toFixed(1)}</span>
                        {plural(locale, l.owner.reviewCount, t.dealer.reviews)}
                      </span>
                    ) : null}
                    <span className="tabular">{plural(locale, l.owner.listingCount, t.dealer.listings)}</span>
                    {l.owner.address ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden /> {l.owner.address}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden /> {regionName}
                      </span>
                    )}
                    {l.owner.workingHours ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden /> {l.owner.workingHours}
                      </span>
                    ) : null}
                  </p>
                  {l.owner.tags.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {l.owner.tags.map((tag) => (
                        <li key={tag} className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
              {!isOwner ? (
                <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-[340px]">
                  <CallButton listingId={l.id} className="h-11" />
                  {telegram ? (
                    <a
                      href={telegramUrl(telegram)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
                    >
                      <Send className="size-4" aria-hidden /> {t.dealer.chat}
                    </a>
                  ) : (
                    <a
                      href="#ariza"
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
                    >
                      {t.dealer.leaveRequest}
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {/* Amortizatsiya va grafik */}
          <PlanViewer plans={l.plans} />

          <PriceHistory points={l.priceHistory} />

          {/* Ariza */}
          {!isOwner ? (
            <div id="ariza" className="scroll-offset grid gap-4 md:grid-cols-[1fr_280px]">
              <LeadForm
                listingId={l.id}
                plans={l.plans}
                defaultName={user?.fullName ?? ''}
                defaultPhone={user?.phone ?? ''}
              />
              <SafetyTips slug={l.slug} t={t.safety} />
            </div>
          ) : (
            <SafetyTips slug={l.slug} t={t.safety} />
          )}
        </div>
      </div>

      {!isOwner ? (
        <MobileCta
          listingId={l.id}
          plans={l.plans.map((p) => ({
            id: p.id,
            isDefault: p.isDefault,
            monthlyPaymentUzs: p.monthlyPaymentUzs,
            planType: p.planType,
          }))}
          cashPriceUzs={l.cashPriceUzs}
        />
      ) : null}

      {similar.length > 0 ? (
        <section className="mt-14" aria-labelledby="similar-title">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 id="similar-title" className="text-[24px] font-bold text-text">{t.similar.title}</h2>
            <Link href="/elonlar" className="text-[14px] font-semibold text-primary hover:underline">
              {t.similar.all}
            </Link>
          </div>
          <ListingGrid listings={similar} columns={4} />
        </section>
      ) : null}
    </div>
  )
}

function SafetyTips({ slug, t }: { slug: string; t: Messages['listing']['safety'] }) {
  return (
    <aside className="card h-fit p-5" aria-label={t.aria}>
      <p className="flex items-center gap-2 text-[15px] font-semibold text-text">
        <ShieldAlert className="size-5 text-warning" aria-hidden /> {t.title}
      </p>
      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
        {t.tips.map((tip) => (
          <li key={tip}>• {tip}</li>
        ))}
      </ul>
      <Link
        href={`/aloqa?shikoyat=${encodeURIComponent(slug)}`}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-danger hover:underline"
      >
        <Flag className="size-3.5" aria-hidden /> {t.report}
      </Link>
    </aside>
  )
}
