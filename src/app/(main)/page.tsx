import Link from 'next/link'
import {
  ArrowRight, BadgePercent, CalendarDays, CarFront, CheckCircle2,
  FileText, ListFilter, Scale, ShieldCheck, Sparkles, Star, TrendingDown, Users,
} from 'lucide-react'
import { getBrands, getLatestListings } from '@/server/listings'
import { getPlatformStats, getTopArendators } from '@/server/profiles'
import { getFavoriteIds } from '@/server/actions/favorites'
import { ListingGrid } from '@/components/listing/listing-grid'
import { SearchBar } from '@/components/layout/search-bar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/format'

export const revalidate = 60

const QUICK_FILTERS = [
  { label: 'Oyiga 5 mln gacha', href: '/elonlar?monthlyMax=5000000&sort=monthly_asc' },
  { label: 'Boshlangʻich 30 mln gacha', href: '/elonlar?downMax=30000000' },
  { label: 'Yangi avtomobillar', href: '/elonlar?condition=NEW' },
  { label: '36 oydan uzoq', href: '/elonlar?termMin=36' },
  { label: 'Arenda', href: '/elonlar?planType=RENT' },
  { label: 'Tasdiqlangan arendatorlar', href: '/elonlar?verified=1' },
]

const STEPS = [
  {
    icon: ListFilter,
    title: 'Filtrlab toping',
    text: 'Oylik toʻlov, boshlangʻich toʻlov va muddat boʻyicha filtrlang. Har bir eʼlonda shartlar ochiq yozilgan.',
  },
  {
    icon: Scale,
    title: 'Taqqoslang',
    text: '4 tagacha avtomobilni yonma-yon qoʻying: jami toʻlov, ustama foizi va grafik bir jadvalda.',
  },
  {
    icon: CalendarDays,
    title: 'Grafikni koʻring',
    text: 'Har oyning toʻlovi, asosiy qarz va ustama qismi — shartnoma imzolashdan oldin hammasi maʼlum.',
  },
  {
    icon: FileText,
    title: 'Ariza qoldiring',
    text: 'Yoqqan shart boʻyicha ariza yuboring — arendator siz bilan bogʻlanadi.',
  },
]

export default async function HomePage() {
  const [latest, brands, stats, arendators, favoriteIds] = await Promise.all([
    getLatestListings(8),
    getBrands(),
    getPlatformStats(),
    getTopArendators(4),
    getFavoriteIds(),
  ])

  const topBrands = brands
    .filter((b) => b._count.listings > 0)
    .sort((a, b) => b._count.listings - a._count.listings)
    .slice(0, 10)

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 10%, var(--primary) 0, transparent 45%), radial-gradient(circle at 85% 20%, var(--accent) 0, transparent 40%)',
          }}
          aria-hidden
        />
        <div className="container-page relative py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="primary" className="mb-5">
              <Sparkles className="size-3.5" />
              {stats.listings} ta faol eʼlon · {stats.plans} ta toʻlov sharti
            </Badge>

            <h1 className="text-balance text-[32px] font-bold leading-[1.15] tracking-tight text-text sm:text-[44px]">
              Avtomobilni <span className="text-primary">rassrochkaga</span> olishning
              eng shaffof yoʻli
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted sm:text-base">
              Arendatorlar mashinalarini boshlangʻich va oylik toʻlov bilan joylaydi.
              Siz esa oylik toʻlovni, jami ustamani va toʻliq yillik grafikni
              yonma-yon taqqoslab, oʻzingizga qulayini tanlaysiz.
            </p>

            <div className="mx-auto mt-7 max-w-xl">
              <SearchBar placeholder="Chevrolet Cobalt, Kia K5, krossover…" />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {QUICK_FILTERS.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Statistika */}
          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Faol eʼlonlar', value: stats.listings, icon: CarFront },
              { label: 'Arendatorlar', value: stats.arendators, icon: Users },
              { label: 'Toʻlov shartlari', value: stats.plans, icon: BadgePercent },
              {
                label: 'Eng past oylik',
                value: formatMoney(stats.minMonthlyUzs, 'UZS', { compact: true }),
                icon: TrendingDown,
              },
            ].map((s) => (
              <div key={s.label} className="card px-4 py-3.5 text-center">
                <s.icon className="mx-auto size-4 text-subtle" />
                <dd className="tabular mt-2 text-xl font-bold text-text">{s.value}</dd>
                <dt className="mt-0.5 text-[12px] text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Markalar ───────────────────────────────────────── */}
      <section className="container-page py-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold text-text">Markalar boʻyicha</h2>
          <Link
            href="/elonlar"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Barchasi <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {topBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/elonlar?brand=${brand.slug}`}
              className="card flex items-center justify-between px-4 py-3 transition-colors hover:border-primary"
            >
              <span className="truncate text-sm font-medium text-text">{brand.name}</span>
              <span className="tabular ml-2 shrink-0 text-xs text-subtle">
                {brand._count.listings}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Tanlangan e'lonlar ─────────────────────────────── */}
      <section className="container-page py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text">Eng soʻnggi takliflar</h2>
            <p className="mt-1 text-sm text-muted">
              Arendatorlar yaqinda joylagan avtomobillar
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/elonlar">
              Barcha eʼlonlar <ArrowRight />
            </Link>
          </Button>
        </div>
        <ListingGrid listings={latest} favoriteIds={favoriteIds} columns={4} className="mt-5" />
      </section>

      {/* ── Qanday ishlaydi ────────────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="container-page py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-text">
              Qanday ishlaydi
            </h2>
            <p className="mt-2 text-sm text-muted">
              Toʻrt qadamda oʻzingizga mos shartni topasiz
            </p>
          </div>

          <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card relative p-5">
                <span className="tabular absolute right-4 top-4 text-[28px] font-bold leading-none text-surface-3">
                  {i + 1}
                </span>
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-3.5 text-[15px] font-semibold text-text">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Arendatorlar ───────────────────────────────────── */}
      <section className="container-page py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text">Ishonchli arendatorlar</h2>
            <p className="mt-1 text-sm text-muted">
              Reyting va sharhlar asosida saralangan
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/arendatorlar">
              Barchasi <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {arendators.map((a) => (
            <Link
              key={a.id}
              href={`/arendator/${a.slug}`}
              className="card group p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-[15px] font-bold text-primary">
                  {a.companyName.slice(0, 2).toUpperCase()}
                </span>
                {a.isVerified ? (
                  <Badge variant="success" size="sm">
                    <ShieldCheck /> Tasdiqlangan
                  </Badge>
                ) : null}
              </div>
              <h3 className="mt-3.5 line-clamp-1x font-semibold text-text group-hover:text-primary">
                {a.companyName}
              </h3>
              <p className="mt-1 line-clamp-2x text-[13px] leading-relaxed text-muted">
                {a.about}
              </p>
              <div className="mt-3.5 flex items-center gap-3 border-t border-border pt-3 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-accent text-accent" />
                  <span className="tabular font-medium text-text">
                    {a.ratingAvg > 0 ? a.ratingAvg.toFixed(1) : '—'}
                  </span>
                  ({a.reviewCount})
                </span>
                <span className="tabular">{a.listingCount} ta eʼlon</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Arendatorlar uchun CTA ─────────────────────────── */}
      <section className="container-page pb-16">
        <div className="card overflow-hidden">
          <div className="grid items-center gap-8 p-8 lg:grid-cols-2 lg:p-12">
            <div>
              <Badge variant="primary" className="mb-4">
                Arendatorlar uchun
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Avtomobilingizni rassrochkaga qoʻying
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Narx, boshlangʻich toʻlov va muddatni kiritasiz — tizim oylik
                toʻlovni va toʻliq grafikni oʻzi hisoblab beradi. Bir eʼlonga
                bir nechta shart qoʻshib, mijozga tanlov bering.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  'Annuitet, oddiy ustama yoki tayyor oylik toʻlov — uch xil hisoblash usuli',
                  'Har bir shart uchun avtomatik oyma-oy grafik',
                  'Arizalarni kabinetda kuzatib borish',
                  'Eʼlon joylash bepul',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-text">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/royxatdan-otish?rol=arendator">Arendator boʻlish</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/kalkulyator">Kalkulyatorni sinash</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                Misol
              </p>
              <p className="mt-1 text-sm font-medium text-text">
                180 mln soʻmlik avtomobil, 30% boshlangʻich, 24 oy, yillik 24%
              </p>
              <dl className="mt-4 space-y-2.5">
                {[
                  ['Boshlangʻich toʻlov', '54 000 000 soʻm'],
                  ['Oylik toʻlov', '6 661 758 soʻm'],
                  ['Jami toʻlov', '213 882 201 soʻm'],
                  ['Ustama', '33 882 201 soʻm (26.9%)'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-border pb-2.5 last:border-0 last:pb-0"
                  >
                    <dt className="text-[13px] text-muted">{label}</dt>
                    <dd className="tabular text-[13px] font-semibold text-text">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[12px] leading-relaxed text-subtle">
                Grafik 24 qatordan iborat boʻlib, har oyda asosiy qarz va ustama
                qismi alohida koʻrsatiladi.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
