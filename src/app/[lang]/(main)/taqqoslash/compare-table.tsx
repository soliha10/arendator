'use client'

import * as React from 'react'
import Image from 'next/image'
import { Link2, Loader2, Scale, ShieldCheck, Trash2, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { ListingDetailDto, PlanDto } from '@/server/mappers'
import { fetchCompareListings } from '@/server/actions/compare'
import { useCompare } from '@/lib/compare-store'
import { MAX_COMPARE_ITEMS } from '@/lib/constants'
import { formatMileage, formatMoney, formatPercent, formatTerm } from '@/lib/format'
import { Link, useHref, useLocale, useMessages } from '@/i18n/client'
import { fmt, plural } from '@/i18n/format'
import { featureLabel, regionLabel } from '@/i18n/labels'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/messages'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Better = 'lower' | 'higher' | 'none'

interface Row {
  key: string
  label: string
  group: string
  /** Ustunlar bo'yicha ko'rsatiladigan matn */
  render: (l: ListingDetailDto, p: PlanDto | undefined) => React.ReactNode
  /** Solishtirish uchun raqamli qiymat (eng yaxshisini ajratish uchun) */
  numeric?: (l: ListingDetailDto, p: PlanDto | undefined) => number | null
  better?: Better
}

function buildRows(m: Messages, locale: Locale): Row[] {
  const t = m.compare.rows
  const g = m.compare.groups
  const e = m.enums
  const money = (v: number, cur: 'UZS' | 'USD' = 'UZS', compact = false) =>
    formatMoney(v, cur, { locale, compact })
  const yesNo = (v: boolean) => (v ? t.yes : t.no)

  return [
    // ── Narx ──
    {
      key: 'cash',
      group: g.price,
      label: t.cash,
      render: (l) =>
        l.hasCashSale && l.cashPriceUzs ? (
          <span>
            {money(l.cashPriceUzs)}
            {l.isNegotiable ? <span className="block text-[12px] text-subtle">{t.negotiable}</span> : null}
          </span>
        ) : (
          t.notForCash
        ),
      numeric: (l) => (l.hasCashSale ? l.cashPriceUzs : null),
      better: 'lower',
    },
    {
      key: 'priceDrop',
      group: g.price,
      label: t.priceDrop,
      render: (l) =>
        l.previousPriceUzs && l.displayPriceUzs && l.previousPriceUzs > l.displayPriceUzs ? (
          <span className="text-success">−{money(l.previousPriceUzs - l.displayPriceUzs, 'UZS', true)}</span>
        ) : (
          t.unchanged
        ),
    },
    {
      key: 'rentDaily',
      group: g.price,
      label: t.rentDaily,
      render: (l) => (l.rent?.dailyUzs ? fmt(t.perDay, { amount: money(l.rent.dailyUzs) }) : '—'),
      numeric: (l) => l.rent?.dailyUzs ?? null,
      better: 'lower',
    },
    {
      key: 'rentMonthly',
      group: g.price,
      label: t.rentMonthly,
      render: (l) =>
        l.rent ? (
          <span>
            {money(l.rent.monthlyUzs)}
            {l.rent.ownershipTransfer ? (
              <span className="block text-[12px] text-success">{t.rentToOwn}</span>
            ) : null}
          </span>
        ) : (
          '—'
        ),
      numeric: (l) => l.rent?.monthlyUzs ?? null,
      better: 'lower',
    },

    // ── To'lov shartlari ──
    {
      key: 'planType',
      group: g.terms,
      label: t.planType,
      render: (_l, p) => (p ? e.planType[p.planType] : '—'),
    },
    {
      key: 'downPayment',
      group: g.terms,
      label: t.downPayment,
      render: (_l, p) => (p ? money(p.downPayment, p.currency) : '—'),
      numeric: (_l, p) => p?.downPaymentUzs ?? null,
      better: 'lower',
    },
    {
      key: 'downPercent',
      group: g.terms,
      label: t.downPercent,
      render: (_l, p) => (p ? formatPercent(p.downPaymentPercent, 1, locale) : '—'),
      numeric: (_l, p) => p?.downPaymentPercent ?? null,
      better: 'lower',
    },
    {
      key: 'monthly',
      group: g.terms,
      label: t.monthly,
      render: (_l, p) => (p ? money(p.monthlyPayment, p.currency) : '—'),
      numeric: (_l, p) => p?.monthlyPaymentUzs ?? null,
      better: 'lower',
    },
    {
      key: 'term',
      group: g.terms,
      label: t.term,
      render: (_l, p) => (p ? formatTerm(p.termMonths, locale) : '—'),
      numeric: (_l, p) => p?.termMonths ?? null,
      better: 'none',
    },
    {
      key: 'carPrice',
      group: g.terms,
      label: t.carPrice,
      render: (_l, p) => (p ? money(p.carPrice, p.currency) : '—'),
      numeric: (_l, p) => p?.carPriceUzs ?? null,
      better: 'lower',
    },
    {
      key: 'total',
      group: g.terms,
      label: t.total,
      render: (_l, p) => (p ? money(p.totalPayable, p.currency) : '—'),
      numeric: (_l, p) => (p ? (p.totalPayable / (p.carPrice || 1)) * (p.carPriceUzs || 1) : null),
      better: 'lower',
    },
    {
      key: 'markup',
      group: g.terms,
      label: t.markup,
      render: (_l, p) =>
        p ? (
          <span>
            {money(p.markupAmount, p.currency)}
            {p.carPrice > 0 ? (
              <span className="block text-[12px] text-subtle">
                {fmt(t.markupShare, { percent: formatPercent((p.markupAmount / p.carPrice) * 100, 1, locale) })}
              </span>
            ) : null}
          </span>
        ) : (
          '—'
        ),
      numeric: (_l, p) => (p && p.carPrice > 0 ? (p.markupAmount / p.carPrice) * 100 : null),
      better: 'lower',
    },
    {
      key: 'rate',
      group: g.terms,
      label: t.rate,
      render: (_l, p) => (p && p.markupPercent > 0 ? formatPercent(p.markupPercent, 2, locale) : '—'),
      numeric: (_l, p) => (p?.markupPercent ? p.markupPercent : null),
      better: 'lower',
    },
    {
      key: 'ownership',
      group: g.terms,
      label: t.ownership,
      render: (_l, p) => (p ? yesNo(p.ownershipTransfer) : '—'),
    },
    {
      key: 'insurance',
      group: g.terms,
      label: t.insurance,
      render: (_l, p) => (p ? yesNo(p.insuranceIncluded) : '—'),
    },
    {
      key: 'casco',
      group: g.terms,
      label: t.casco,
      render: (_l, p) => (p ? yesNo(p.cascoIncluded) : '—'),
    },
    {
      key: 'maintenance',
      group: g.terms,
      label: t.maintenance,
      render: (_l, p) => (p ? yesNo(p.maintenanceIncluded) : '—'),
    },
    {
      key: 'deposit',
      group: g.terms,
      label: t.deposit,
      render: (_l, p) => (p?.depositAmount ? money(p.depositAmount, p.currency) : '—'),
      numeric: (_l, p) => p?.depositAmount ?? null,
      better: 'lower',
    },
    {
      key: 'earlyPayoff',
      group: g.terms,
      label: t.earlyPayoff,
      render: (_l, p) => (p ? (p.earlyPayoffAllowed ? t.allowed : t.notAllowed) : '—'),
    },

    // ── Avtomobil ──
    {
      key: 'year',
      group: g.car,
      label: t.year,
      render: (l) => String(l.year),
      numeric: (l) => l.year,
      better: 'higher',
    },
    {
      key: 'mileage',
      group: g.car,
      label: t.mileage,
      render: (l) => formatMileage(l.mileage, locale),
      numeric: (l) => l.mileage,
      better: 'lower',
    },
    { key: 'condition', group: g.car, label: t.condition, render: (l) => e.condition[l.condition] },
    { key: 'body', group: g.car, label: t.body, render: (l) => e.bodyType[l.bodyType] },
    { key: 'transmission', group: g.car, label: t.transmission, render: (l) => e.transmission[l.transmission] },
    { key: 'fuel', group: g.car, label: t.fuel, render: (l) => e.fuelType[l.fuelType] },
    { key: 'drive', group: g.car, label: t.drive, render: (l) => e.driveTypeLong[l.driveType] },
    {
      key: 'engine',
      group: g.car,
      label: t.engine,
      render: (l) => (l.engineVolume ? `${l.engineVolume} ${locale === 'ru' ? 'л' : 'L'}` : '—'),
      numeric: (l) => l.engineVolume,
      better: 'none',
    },
    { key: 'color', group: g.car, label: t.color, render: (l) => l.color ?? '—' },
    {
      key: 'features',
      group: g.car,
      label: t.features,
      render: (l) =>
        l.features.length ? (
          <span>
            <span className="font-semibold">{plural(locale, l.features.length, t.featuresCount)}</span>
            <span className="mt-0.5 block text-[12px] font-normal leading-snug text-muted">
              {l.features.slice(0, 4).map((f) => featureLabel(m, f)).join(', ')}
              {l.features.length > 4 ? '…' : ''}
            </span>
          </span>
        ) : (
          '—'
        ),
      numeric: (l) => l.features.length,
      better: 'higher',
    },

    // ── E'lon beruvchi ──
    {
      key: 'owner',
      group: g.seller,
      label: t.name,
      render: (l) =>
        l.owner.slug ? (
          <Link href={`/arendator/${l.owner.slug}`} className="text-primary hover:underline">
            {l.ownerName}
          </Link>
        ) : (
          l.ownerName
        ),
    },
    {
      key: 'verified',
      group: g.seller,
      label: t.verified,
      render: (l) =>
        l.owner.isVerified ? (
          <span className="inline-flex items-center gap-1 text-success">
            <ShieldCheck className="size-4" /> {t.yes}
          </span>
        ) : (
          t.no
        ),
    },
    {
      key: 'rating',
      group: g.seller,
      label: t.rating,
      render: (l) =>
        l.owner.reviewCount > 0
          ? fmt(plural(locale, l.owner.reviewCount, t.ratingValue), { rating: l.owner.ratingAvg.toFixed(1) })
          : t.noReviews,
      numeric: (l) => (l.owner.reviewCount > 0 ? l.owner.ratingAvg : null),
      better: 'higher',
    },
    {
      key: 'region',
      group: g.seller,
      label: t.location,
      render: (l) => regionLabel(m, l.regionSlug, l.regionName),
    },
  ]
}

export function CompareTable() {
  const { items, remove, clear, isReady, toggle } = useCompare()
  const m = useMessages()
  const t = m.compare.table
  const locale = useLocale()
  const href = useHref()
  const ROWS = React.useMemo(() => buildRows(m, locale), [m, locale])
  // Shart nomi diler kiritgan matn (o'zbekcha) — tilga mos qisqa nom yasaymiz
  const planName = (p: PlanDto) =>
    fmt(m.listing.finance.termChipTyped, { n: p.termMonths, type: m.enums.planType[p.planType] })
  const searchParams = useSearchParams()
  // Havola orqali kelgan taqqoslash (?ids=...) — ulashish uchun
  const sharedIds = React.useMemo(() => {
    const raw = searchParams.get('ids')
    return raw ? raw.split(',').filter(Boolean).slice(0, MAX_COMPARE_ITEMS) : null
  }, [searchParams])
  const ids = React.useMemo(
    () => (sharedIds ? sharedIds.join(',') : items.map((i) => i.id).join(',')),
    [items, sharedIds],
  )

  // Yuklangan maʼlumot qaysi roʻyxatga tegishli ekanini kalit bilan belgilaymiz —
  // shunda roʻyxat oʻzgarganda eski natija koʻrsatilmaydi.
  const [loaded, setLoaded] = React.useState<{
    key: string
    listings: ListingDetailDto[]
  } | null>(null)
  const [planByListing, setPlanByListing] = React.useState<Record<string, string>>({})
  const [onlyDiff, setOnlyDiff] = React.useState(false)

  React.useEffect(() => {
    if (!ids) return
    let cancelled = false
    fetchCompareListings(ids.split(',')).then((data) => {
      if (!cancelled) setLoaded({ key: ids, listings: data })
    })
    return () => {
      cancelled = true
    }
  }, [ids])

  /**
   * Roʻyxat oʻzgarganda skelet "chaqnamasligi" uchun mavjud maʼlumotni
   * joriy id'lar boʻyicha filtrlab koʻrsatamiz — element olib tashlansa
   * ustun darhol yoʻqoladi, yangisi esa yuklangach qoʻshiladi.
   */
  const idSet = React.useMemo(
    () => new Set(ids ? ids.split(',') : []),
    [ids],
  )
  const isStale = Boolean(ids) && loaded?.key !== ids
  const listings: ListingDetailDto[] | null = !ids
    ? []
    : loaded
      ? loaded.listings.filter((l) => idSet.has(l.id))
      : null

  if (!isReady || listings === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon={<Scale />}
        title={t.empty}
        description={t.emptyText}
        action={
          <Button asChild>
            <Link href="/elonlar">{t.toListings}</Link>
          </Button>
        }
      />
    )
  }

  const getPlan = (l: ListingDetailDto): PlanDto | undefined =>
    l.plans.find((p) => p.id === planByListing[l.id]) ??
    l.plans.find((p) => p.isDefault) ??
    l.plans[0]

  const visibleRows = ROWS.filter((row) => {
    if (!onlyDiff || listings.length < 2) return true
    const values = listings.map((l) => {
      const node = row.render(l, getPlan(l))
      return typeof node === 'string' ? node : JSON.stringify(row.numeric?.(l, getPlan(l)))
    })
    return new Set(values).size > 1
  })

  const groups = [...new Set(visibleRows.map((r) => r.group))]

  /** Qatordagi eng yaxshi qiymatni aniqlaydi */
  const bestIds = (row: Row): Set<string> => {
    if (!row.numeric || row.better === 'none' || !row.better || listings.length < 2) {
      return new Set()
    }
    const pairs = listings
      .map((l) => ({ id: l.id, value: row.numeric!(l, getPlan(l)) }))
      .filter((p): p is { id: string; value: number } => p.value !== null)
    if (pairs.length < 2) return new Set()
    // Hamma qiymat bir xil boʻlsa, ajratib koʻrsatishning maʼnosi yoʻq
    if (new Set(pairs.map((p) => p.value)).size === 1) return new Set()
    const best =
      row.better === 'lower'
        ? Math.min(...pairs.map((p) => p.value))
        : Math.max(...pairs.map((p) => p.value))
    return new Set(pairs.filter((p) => p.value === best).map((p) => p.id))
  }

  const columnWidth = `${Math.floor(100 / Math.max(1, listings.length))}%`
  // Telefonda 200px lik sarlavha ustuni ekranning yarmini yeb qoʻyardi
  const labelColClass = 'w-[108px] min-w-[108px] sm:w-[200px] sm:min-w-[200px]'

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-text lg:min-h-0">
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="size-5 accent-[var(--primary)] lg:size-4"
          />
          {t.onlyDiff}
        </label>

        <div className="flex w-full flex-wrap items-center gap-1 sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}${href('/taqqoslash')}?ids=${listings.map((l) => l.id).join(',')}`
              navigator.clipboard
                ?.writeText(url)
                .then(() => toast.success(t.shareCopied))
                .catch(() => toast.error(t.shareFailed))
            }}
          >
            <Link2 /> {t.share}
          </Button>

          {sharedIds ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                for (const l of listings) {
                  if (!items.some((i) => i.id === l.id)) {
                    toggle({
                      id: l.id,
                      slug: l.slug,
                      title: l.title,
                      imageUrl: l.images[0]?.url ?? null,
                    })
                  }
                }
                toast.success(t.addedToMine)
              }}
            >
              {t.addToMine}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 /> {t.clear}
            </Button>
          )}
        </div>
      </div>

      {sharedIds ? (
        <p className="mb-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-[13px] text-muted">
          {t.sharedNote}
        </p>
      ) : null}

      {listings.length > 1 ? (
        <p className="mb-2 text-[12px] text-subtle sm:hidden">
          {t.swipe}
        </p>
      ) : null}

      <div className="scroll-contain overflow-x-auto rounded-xl border border-border surface-shadow">
        <table className="w-full table-fixed border-collapse bg-surface">
          <colgroup>
            <col className={labelColClass} />
            {listings.map((l) => (
              <col
                key={l.id}
                className="w-[150px] min-w-[150px] sm:w-[200px] sm:min-w-[200px]"
                style={{ width: columnWidth }}
              />
            ))}
          </colgroup>
          {/* Sarlavha: avtomobillar */}
          <thead>
            <tr>
              <th className={cn(labelColClass, "sticky left-0 z-10 border-b border-r border-border bg-surface p-2.5 text-left align-bottom sm:p-3")}>
                <span className="text-[12px] font-semibold uppercase tracking-wide text-subtle">
                  {t.metric}
                </span>
              </th>
              {listings.map((l) => {
                const plan = getPlan(l)
                return (
                  <th
                    key={l.id}
                    className="border-b border-r border-border p-2.5 text-left align-top last:border-r-0 sm:p-3"
                  >
                    <div className="relative">
                      {!sharedIds ? (
                        <button
                          type="button"
                          onClick={() => remove(l.id)}
                          aria-label={fmt(t.remove, { title: l.title })}
                          className="absolute right-0 top-0 rounded-lg p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-danger"
                        >
                          <X className="size-4" />
                        </button>
                      ) : null}

                      <Link href={`/elon/${l.slug}`} className="block">
                        <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-2">
                          {l.images[0] ? (
                            <Image
                              src={l.images[0].url}
                              alt={l.title}
                              fill
                              sizes="220px"
                              className="object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="mt-2 block pr-6 text-[13px] font-semibold leading-snug text-text hover:text-primary">
                          {l.title}
                        </span>
                      </Link>

                      {l.plans.length > 1 ? (
                        <Select
                          value={plan?.id ?? ''}
                          onChange={(e) =>
                            setPlanByListing((prev) => ({ ...prev, [l.id]: e.target.value }))
                          }
                          aria-label={t.plan}
                          className="mt-2 h-8 text-[12px]"
                        >
                          {l.plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {planName(p)}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <p className="mt-2 text-[12px] text-muted">{plan ? planName(plan) : null}</p>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => (
              <React.Fragment key={group}>
                <tr>
                  <td
                    colSpan={listings.length + 1}
                    className="sticky left-0 border-y border-border bg-surface-2 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-subtle sm:px-3 sm:text-[12px]"
                  >
                    {group}
                  </td>
                </tr>
                {visibleRows
                  .filter((r) => r.group === group)
                  .map((row) => {
                    const best = bestIds(row)
                    return (
                      <tr key={row.key} className="hover:bg-surface-2/40">
                        <th className={cn(labelColClass, "sticky left-0 z-10 border-b border-r border-border bg-surface p-2.5 text-left text-[12px] font-medium leading-snug text-muted hyphens-auto [overflow-wrap:anywhere] sm:p-3 sm:text-[13px]")}>
                          {row.label}
                        </th>
                        {listings.map((l) => (
                          <td
                            key={l.id}
                            className={cn(
                              'tabular border-b border-r border-border p-2.5 text-[12px] text-text last:border-r-0 sm:p-3 sm:text-[13px]',
                              best.has(l.id) && 'bg-success-soft font-semibold text-success',
                            )}
                          >
                            {row.render(l, getPlan(l))}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
              </React.Fragment>
            ))}

            {/* Amallar */}
            <tr>
              <th className={cn(labelColClass, "sticky left-0 z-10 border-r border-border bg-surface p-2.5 sm:p-3")} />
              {listings.map((l) => (
                <td key={l.id} className="border-r border-border p-2.5 last:border-r-0 sm:p-3">
                  <Button asChild block size="sm">
                    <Link href={`/elon/${l.slug}`}>{t.details}</Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {isStale ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
          <Loader2 className="size-4 animate-spin" /> {t.updating}
        </p>
      ) : null}

      <p className="mt-4 text-[12px] leading-relaxed text-subtle">
        {t.legend}
      </p>
    </div>
  )
}
