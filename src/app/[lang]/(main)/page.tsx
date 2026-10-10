import {
  ArrowRight, BadgeCheck, Banknote, BatteryCharging, CalendarDays, CarFront,
  ChevronDown, FileSearch, KeyRound, LineChart, Scale, ShieldCheck, Sparkles,
  TrendingDown,
} from 'lucide-react'
import { getBrandsWithModels, getFeaturedListings, getMarketStats, searchListings } from '@/server/listings'
import { getHomeExtras, getPriceDropListings } from '@/server/home'
import { getFavoriteIds } from '@/server/actions/favorites'
import { parseListingFilters } from '@/lib/validation/filters'
import { ListingGrid } from '@/components/listing/listing-grid'
import { HeroSearch } from '@/components/home/hero-search'
import { PaymentWidget } from '@/components/home/payment-widget'
import { HomeFaq } from '@/components/home/faq'
import { formatMoney } from '@/lib/format'
import { Link } from '@/i18n/client'
import { fmt, plural } from '@/i18n/format'
import { getLocale, getMessages } from '@/i18n/server'
import { cn } from '@/lib/utils'

/** "Bozordagi eng manfaatli" bo'limidagi saralash variantlari */
const FEATURED_SORTS = [
  { value: '', key: 'sortRecommended' },
  { value: 'monthly_asc', key: 'sortCheapMonthly' },
  { value: 'newest', key: 'sortNewest' },
] as const

const STEP_ICONS = [FileSearch, Scale, KeyRound]
const BENEFIT_ICONS = [CalendarDays, Scale, ShieldCheck, LineChart]

/** Raqamni guruhlab yozish (Intl'siz — server va brauzerda bir xil) */
const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export default async function HomePage(props: PageProps<'/[lang]'>) {
  const searchParams = await props.searchParams
  const sortParam = typeof searchParams.saralash === 'string' ? searchParams.saralash : ''
  const featuredSort = FEATURED_SORTS.find((s) => s.value === sortParam)?.value ?? ''
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.home
  const n = (count: number, forms: Parameters<typeof plural>[2]) => plural(locale, count, forms)

  const [stats, extras, brands, featured, sorted, drops, favoriteIds] = await Promise.all([
    getMarketStats(),
    getHomeExtras(),
    getBrandsWithModels(),
    featuredSort ? Promise.resolve(null) : getFeaturedListings(6),
    featuredSort
      ? searchListings(parseListingFilters({ sort: featuredSort, perPage: '6' }))
      : Promise.resolve(null),
    getPriceDropListings(4),
    getFavoriteIds(),
  ])
  const listings = sorted ? sorted.items : (featured ?? [])

  const heroBrands = brands
    .filter((b) => b.models.length > 0)
    .map((b) => ({ slug: b.slug, name: b.name, models: b.models.map((m) => ({ slug: m.slug, name: m.name })) }))

  const categories = [
    {
      icon: BatteryCharging,
      title: t.categories.electric,
      hint: n(stats.electric, t.categories.listings),
      href: '/elonlar?fuel=ELECTRIC,HYBRID',
      tone: 'bg-primary-soft text-primary',
    },
    {
      icon: BadgeCheck,
      title: t.categories.fresh,
      hint: n(stats.fresh, t.categories.freshHint),
      href: '/elonlar?condition=NEW',
      tone: 'bg-success-soft text-success',
    },
    {
      icon: KeyRound,
      title: t.categories.rent,
      hint: extras.minDailyRentUzs
        ? fmt(t.categories.rentDaily, {
            amount: formatMoney(extras.minDailyRentUzs, 'UZS', { compact: true, locale }),
          })
        : n(stats.rent, t.categories.listings),
      href: '/elonlar?planType=RENT&sort=monthly_asc',
      tone: 'bg-surface-3 text-primary',
    },
    {
      icon: Banknote,
      title: t.categories.cash,
      hint: n(stats.cash, t.categories.cashHint),
      href: '/elonlar?planType=CASH&sort=price_asc',
      tone: 'bg-warning-soft text-warning',
    },
  ]

  return (
    <>
      {/* ── Hero va qidiruv ────────────────────────────────── */}
      <section className="border-b border-border bg-surface">
        <div className="container-page pb-10 pt-6 sm:pb-12 sm:pt-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary">
              <BadgeCheck className="size-3.5" aria-hidden />
              {t.hero.badge}
            </span>
            <h1 className="mt-3 text-balance text-[30px] font-extrabold leading-[1.1] tracking-tight text-text sm:text-[40px] lg:text-[48px]">
              {t.hero.title}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted sm:text-base">
              {t.hero.subtitle}
            </p>
          </div>

          <div className="mt-6 sm:mt-8">
            <HeroSearch brands={heroBrands} total={stats.total} />
          </div>
        </div>
      </section>

      {/* ── Oylik to'lov kalkulyatori ──────────────────────── */}
      <section className="bg-surface-2/60">
        <div className="container-page grid gap-6 py-10 sm:py-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)] lg:items-center lg:gap-10">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-success">
              <ShieldCheck className="size-4" aria-hidden /> {t.calc.badge}
            </span>
            <h2 className="mt-2 text-[24px] font-extrabold leading-tight text-text sm:text-[30px]">
              {t.calc.title}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              {t.calc.text}
            </p>
            <Link
              href="/kalkulyator"
              className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline"
            >
              {t.calc.fullLink} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <PaymentWidget
            priceMin={extras.priceMin}
            priceMax={extras.priceMax}
            ratePercent={extras.avgRatePercent}
            minLabel={formatMoney(Math.max(5_000_000, Math.round(extras.priceMin / 5_000_000) * 5_000_000), 'UZS', { compact: true, locale })}
            maxLabel={formatMoney(Math.round(extras.priceMax / 5_000_000) * 5_000_000, 'UZS', { compact: true, locale })}
          />
        </div>
      </section>

      {/* ── Kategoriyalar ──────────────────────────────────── */}
      <section className="container-page pt-10 sm:pt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[20px] font-extrabold text-text sm:text-[22px]">
            {t.categories.title}
          </h2>
          <Link href="/elonlar" className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
            {t.categories.all} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="hide-scrollbar -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="flex w-36 shrink-0 snap-start flex-col items-center gap-2.5 rounded-xl bg-surface-2 p-4 text-center transition-colors hover:bg-surface-3 sm:w-auto sm:flex-row sm:gap-4 sm:text-left"
            >
              <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', c.tone)}>
                <c.icon className="size-6" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold leading-snug text-text sm:truncate sm:text-[15px]">{c.title}</span>
                <span className="tabular mt-0.5 block text-[12px] text-muted sm:truncate">{c.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Tanlangan e'lonlar ─────────────────────────────── */}
      <section className="container-page py-10 sm:py-12" id="takliflar">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{t.featured.eyebrow}</p>
            <h2 className="mt-1 text-[22px] font-extrabold text-text sm:text-[28px]">
              {t.featured.title}
            </h2>
          </div>
          <nav aria-label={t.featured.sortAria} className="flex items-center gap-1 rounded-lg bg-surface-2 p-1">
            {FEATURED_SORTS.map((s) => {
              const active = s.value === featuredSort
              return (
                <Link
                  key={s.value}
                  href={s.value ? `/?saralash=${s.value}#takliflar` : '/#takliflar'}
                  scroll={false}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    active ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
                  )}
                >
                  {t.featured[s.key]}
                </Link>
              )
            })}
          </nav>
        </div>

        <ListingGrid listings={listings} favoriteIds={favoriteIds} mobileLimit={4} className="mt-6" />

        <div className="mt-8 flex flex-col items-center gap-2">
          <Link
            href={featuredSort ? `/elonlar?sort=${featuredSort}` : '/elonlar'}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-6 text-[14px] font-semibold text-text shadow-sm transition-colors hover:bg-surface-2"
          >
            {n(stats.total, t.featured.viewAll)} <ChevronDown className="size-4 -rotate-90" aria-hidden />
          </Link>
          <p className="tabular text-[12px] text-subtle">
            {fmt(t.featured.shown, { total: stats.total, shown: Math.min(listings.length, stats.total) })}
          </p>
        </div>
      </section>

      {/* ── Narxi tushganlar (CarGurus uslubida) ───────────── */}
      {drops.length > 0 ? (
        <section className="border-y border-border bg-success-soft/40">
          <div className="container-page py-10 sm:py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-success">
                  <TrendingDown className="size-4" aria-hidden /> {t.drops.eyebrow}
                </span>
                <h2 className="mt-1 text-[22px] font-extrabold text-text sm:text-[26px]">
                  {t.drops.title}
                </h2>
              </div>
              <Link
                href="/elonlar?priceDrop=1"
                className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
              >
                {fmt(t.drops.all, { n: stats.priceDrops })} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ListingGrid
              listings={drops}
              favoriteIds={favoriteIds}
              columns={4}
              mobileLimit={2}
              className="mt-6"
            />
          </div>
        </section>
      ) : null}

      {/* ── Statistika va afzalliklar ──────────────────────── */}
      <section className="bg-surface">
        <div className="container-page py-12 sm:py-16">
          <dl className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: CarFront,
                value: group(stats.total),
                title: t.stats.activeTitle,
                text: fmt(t.stats.activeText, {
                  parts: [
                    stats.rent && n(stats.rent, t.stats.rent),
                    stats.installment && n(stats.installment, t.stats.installment),
                    stats.leasing && n(stats.leasing, t.stats.leasing),
                    stats.cash && n(stats.cash, t.stats.cash),
                  ]
                    .filter(Boolean)
                    .join(', '),
                }),
              },
              {
                icon: BadgeCheck,
                value: group(stats.dealers),
                title: t.stats.dealersTitle,
                text: t.stats.dealersText,
              },
              {
                icon: TrendingDown,
                value: group(stats.priceDrops),
                title: t.stats.dropsTitle,
                text: t.stats.dropsText,
              },
            ].map((s) => (
              <div key={s.title} className="rounded-xl bg-surface-2 p-6">
                <div className="flex items-center gap-2.5">
                  <s.icon className="size-6 text-primary" aria-hidden />
                  <dd className="font-display tabular text-[26px] font-extrabold text-primary">{s.value}</dd>
                </div>
                <dt className="mt-2 text-[17px] font-bold text-text">{s.title}</dt>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </dl>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.benefits.map((b, i) => {
              const Icon = BENEFIT_ICONS[i]
              return (
              <li key={b.title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-text">{b.title}</span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">{b.text}</span>
                </span>
              </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── Qanday ishlaydi ────────────────────────────────── */}
      <section className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[24px] font-extrabold text-text sm:text-[28px]">{t.steps.title}</h2>
          <p className="mt-2 text-[14px] text-muted">{t.steps.subtitle}</p>
        </div>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {t.steps.items.map((s, i) => {
            const Icon = STEP_ICONS[i]
            return (
            <li key={s.title} className="relative rounded-xl border border-border bg-surface p-6">
              <span className="font-display tabular absolute right-5 top-4 text-[40px] font-extrabold leading-none text-surface-3">
                {i + 1}
              </span>
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-fg">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-text">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.text}</p>
            </li>
            )
          })}
        </ol>
      </section>

      {/* ── Dilerlar uchun CTA ─────────────────────────────── */}
      <section className="container-page pb-12 sm:pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-primary-fg sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div
            className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-white/10"
            aria-hidden
          />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
              <Sparkles className="size-3.5" aria-hidden /> {t.cta.badge}
            </span>
            <h2 className="mt-3 text-[24px] font-extrabold leading-tight sm:text-[30px]">
              {t.cta.title}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed opacity-90">
              {t.cta.text}
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <Link
              href="/kabinet/elon/yangi"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-surface px-6 text-[14px] font-bold text-primary transition-colors hover:bg-surface-2"
            >
              {t.cta.post}
            </Link>
            <Link
              href="/dilerlar"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white/15 px-6 text-[14px] font-semibold transition-colors hover:bg-white/25"
            >
              {t.cta.dealers}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="container-page pb-4">
        <h2 className="mb-6 text-center text-[24px] font-extrabold text-text sm:text-[28px]">
          {t.faq.title}
        </h2>
        <HomeFaq items={t.faq.items} />
      </section>
    </>
  )
}
