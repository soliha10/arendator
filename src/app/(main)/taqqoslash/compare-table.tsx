'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Link2, Loader2, Scale, ShieldCheck, Trash2, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import type { ListingDetailDto, PlanDto } from '@/server/mappers'
import { fetchCompareListings } from '@/server/actions/compare'
import { useCompare } from '@/lib/compare-store'
import {
  BODY_TYPE_LABELS, CONDITION_LABELS, DRIVE_TYPE_LABELS, FUEL_TYPE_LABELS,
  MAX_COMPARE_ITEMS, PLAN_TYPE_LABELS, TRANSMISSION_LABELS,
} from '@/lib/constants'
import { formatMileage, formatMoney, formatPercent, formatTerm } from '@/lib/format'
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

const ROWS: Row[] = [
  // ── To'lov shartlari ──
  {
    key: 'planType',
    group: 'Toʻlov shartlari',
    label: 'Shart turi',
    render: (_l, p) => (p ? PLAN_TYPE_LABELS[p.planType] : '—'),
  },
  {
    key: 'downPayment',
    group: 'Toʻlov shartlari',
    label: 'Boshlangʻich toʻlov',
    render: (_l, p) => (p ? formatMoney(p.downPayment, p.currency) : '—'),
    numeric: (_l, p) => p?.downPaymentUzs ?? null,
    better: 'lower',
  },
  {
    key: 'downPercent',
    group: 'Toʻlov shartlari',
    label: 'Boshlangʻich ulushi',
    render: (_l, p) => (p ? formatPercent(p.downPaymentPercent) : '—'),
    numeric: (_l, p) => p?.downPaymentPercent ?? null,
    better: 'lower',
  },
  {
    key: 'monthly',
    group: 'Toʻlov shartlari',
    label: 'Oylik toʻlov',
    render: (_l, p) => (p ? formatMoney(p.monthlyPayment, p.currency) : '—'),
    numeric: (_l, p) => p?.monthlyPaymentUzs ?? null,
    better: 'lower',
  },
  {
    key: 'term',
    group: 'Toʻlov shartlari',
    label: 'Muddat',
    render: (_l, p) => (p ? formatTerm(p.termMonths) : '—'),
    numeric: (_l, p) => p?.termMonths ?? null,
    better: 'none',
  },
  {
    key: 'carPrice',
    group: 'Toʻlov shartlari',
    label: 'Avtomobil narxi',
    render: (_l, p) => (p ? formatMoney(p.carPrice, p.currency) : '—'),
    numeric: (_l, p) => p?.carPriceUzs ?? null,
    better: 'lower',
  },
  {
    key: 'total',
    group: 'Toʻlov shartlari',
    label: 'Jami toʻlov',
    render: (_l, p) => (p ? formatMoney(p.totalPayable, p.currency) : '—'),
    numeric: (_l, p) =>
      p ? (p.totalPayable / (p.carPrice || 1)) * (p.carPriceUzs || 1) : null,
    better: 'lower',
  },
  {
    key: 'markup',
    group: 'Toʻlov shartlari',
    label: 'Ustama (ortiqcha toʻlov)',
    render: (_l, p) =>
      p ? (
        <span>
          {formatMoney(p.markupAmount, p.currency)}
          {p.carPrice > 0 ? (
            <span className="block text-[12px] text-subtle">
              narxning {formatPercent((p.markupAmount / p.carPrice) * 100)}
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
    group: 'Toʻlov shartlari',
    label: 'Samarali yillik foiz',
    render: (_l, p) => (p && p.markupPercent > 0 ? formatPercent(p.markupPercent, 2) : '—'),
    numeric: (_l, p) => (p?.markupPercent ? p.markupPercent : null),
    better: 'lower',
  },
  {
    key: 'ownership',
    group: 'Toʻlov shartlari',
    label: 'Mulk huquqi oʻtadimi',
    render: (_l, p) => (p ? (p.ownershipTransfer ? 'Ha' : 'Yoʻq') : '—'),
  },
  {
    key: 'insurance',
    group: 'Toʻlov shartlari',
    label: 'Sugʻurta narxda',
    render: (_l, p) => (p ? (p.insuranceIncluded ? 'Ha' : 'Yoʻq') : '—'),
  },
  {
    key: 'casco',
    group: 'Toʻlov shartlari',
    label: 'KASKO narxda',
    render: (_l, p) => (p ? (p.cascoIncluded ? 'Ha' : 'Yoʻq') : '—'),
  },
  {
    key: 'maintenance',
    group: 'Toʻlov shartlari',
    label: 'Texnik xizmat narxda',
    render: (_l, p) => (p ? (p.maintenanceIncluded ? 'Ha' : 'Yoʻq') : '—'),
  },
  {
    key: 'deposit',
    group: 'Toʻlov shartlari',
    label: 'Zalog',
    render: (_l, p) =>
      p?.depositAmount ? formatMoney(p.depositAmount, p.currency) : '—',
    numeric: (_l, p) => p?.depositAmount ?? null,
    better: 'lower',
  },
  {
    key: 'earlyPayoff',
    group: 'Toʻlov shartlari',
    label: 'Muddatidan oldin yopish',
    render: (_l, p) => (p ? (p.earlyPayoffAllowed ? 'Mumkin' : 'Mumkin emas') : '—'),
  },

  // ── Avtomobil ──
  {
    key: 'year',
    group: 'Avtomobil',
    label: 'Yil',
    render: (l) => String(l.year),
    numeric: (l) => l.year,
    better: 'higher',
  },
  {
    key: 'mileage',
    group: 'Avtomobil',
    label: 'Yurgan masofa',
    render: (l) => formatMileage(l.mileage),
    numeric: (l) => l.mileage,
    better: 'lower',
  },
  {
    key: 'condition',
    group: 'Avtomobil',
    label: 'Holati',
    render: (l) => CONDITION_LABELS[l.condition],
  },
  {
    key: 'body',
    group: 'Avtomobil',
    label: 'Kuzov',
    render: (l) => BODY_TYPE_LABELS[l.bodyType],
  },
  {
    key: 'transmission',
    group: 'Avtomobil',
    label: 'Uzatmalar qutisi',
    render: (l) => TRANSMISSION_LABELS[l.transmission],
  },
  {
    key: 'fuel',
    group: 'Avtomobil',
    label: 'Yoqilgʻi',
    render: (l) => FUEL_TYPE_LABELS[l.fuelType],
  },
  {
    key: 'drive',
    group: 'Avtomobil',
    label: 'Uzatma',
    render: (l) => DRIVE_TYPE_LABELS[l.driveType],
  },
  {
    key: 'engine',
    group: 'Avtomobil',
    label: 'Dvigatel hajmi',
    render: (l) => (l.engineVolume ? `${l.engineVolume} L` : '—'),
    numeric: (l) => l.engineVolume,
    better: 'none',
  },
  {
    key: 'color',
    group: 'Avtomobil',
    label: 'Rangi',
    render: (l) => l.color ?? '—',
  },

  // ── Arendator ──
  {
    key: 'owner',
    group: 'Arendator',
    label: 'Nomi',
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
    group: 'Arendator',
    label: 'Tasdiqlangan',
    render: (l) =>
      l.owner.isVerified ? (
        <span className="inline-flex items-center gap-1 text-success">
          <ShieldCheck className="size-4" /> Ha
        </span>
      ) : (
        'Yoʻq'
      ),
  },
  {
    key: 'rating',
    group: 'Arendator',
    label: 'Reyting',
    render: (l) =>
      l.owner.reviewCount > 0
        ? `${l.owner.ratingAvg.toFixed(1)} (${l.owner.reviewCount} sharh)`
        : 'Sharh yoʻq',
    numeric: (l) => (l.owner.reviewCount > 0 ? l.owner.ratingAvg : null),
    better: 'higher',
  },
  {
    key: 'region',
    group: 'Arendator',
    label: 'Joylashuv',
    render: (l) => l.regionName,
  },
]

export function CompareTable() {
  const { items, remove, clear, isReady, toggle } = useCompare()
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
        title="Taqqoslash roʻyxati boʻsh"
        description="Eʼlonlar sahifasida yoqqan avtomobillarni tarozi belgisi orqali qoʻshing — keyin ularni shu yerda yonma-yon solishtirasiz."
        action={
          <Button asChild>
            <Link href="/elonlar">Eʼlonlarga oʻtish</Link>
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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Faqat farqlarni koʻrsatish
        </label>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = `${window.location.origin}/taqqoslash?ids=${listings.map((l) => l.id).join(',')}`
              navigator.clipboard
                ?.writeText(url)
                .then(() => toast.success('Havola nusxalandi — istalgan odamga yuboring'))
                .catch(() => toast.error('Havolani nusxalab boʻlmadi'))
            }}
          >
            <Link2 /> Havolani ulashish
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
                toast.success('Oʻz roʻyxatingizga qoʻshildi')
              }}
            >
              Roʻyxatimga qoʻshish
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 /> Tozalash
            </Button>
          )}
        </div>
      </div>

      {sharedIds ? (
        <p className="mb-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-[13px] text-muted">
          Bu — havola orqali ulashilgan taqqoslash. Oʻz roʻyxatingiz oʻzgarmadi.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[14px] border border-border">
        <table
          className="w-full table-fixed border-collapse bg-surface"
          style={{ minWidth: `${200 + listings.length * 220}px` }}
        >
          <colgroup>
            <col style={{ width: '200px' }} />
            {listings.map((l) => (
              <col key={l.id} style={{ width: columnWidth }} />
            ))}
          </colgroup>
          {/* Sarlavha: avtomobillar */}
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-border bg-surface p-3 text-left align-bottom">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-subtle">
                  Koʻrsatkich
                </span>
              </th>
              {listings.map((l) => {
                const plan = getPlan(l)
                return (
                  <th
                    key={l.id}
                    className="border-b border-r border-border p-3 text-left align-top last:border-r-0"
                  >
                    <div className="relative">
                      {!sharedIds ? (
                        <button
                          type="button"
                          onClick={() => remove(l.id)}
                          aria-label={`${l.title} ni olib tashlash`}
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
                          aria-label="Toʻlov sharti"
                          className="mt-2 h-8 text-[12px]"
                        >
                          {l.plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <p className="mt-2 text-[12px] text-muted">{plan?.name}</p>
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
                    className="sticky left-0 border-y border-border bg-surface-2 px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-subtle"
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
                        <th className="sticky left-0 z-10 border-b border-r border-border bg-surface p-3 text-left text-[13px] font-medium text-muted">
                          {row.label}
                        </th>
                        {listings.map((l) => (
                          <td
                            key={l.id}
                            className={cn(
                              'tabular border-b border-r border-border p-3 text-[13px] text-text last:border-r-0',
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
              <th className="sticky left-0 z-10 border-r border-border bg-surface p-3" />
              {listings.map((l) => (
                <td key={l.id} className="border-r border-border p-3 last:border-r-0">
                  <Button asChild block size="sm">
                    <Link href={`/elon/${l.slug}`}>Batafsil</Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {isStale ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
          <Loader2 className="size-4 animate-spin" /> Yangilanmoqda…
        </p>
      ) : null}

      <p className="mt-4 text-[12px] leading-relaxed text-subtle">
        Yashil rang bilan har bir koʻrsatkich boʻyicha eng qulay variant ajratilgan.
        Har xil valyutadagi shartlar solishtirish uchun soʻmga oʻgirilgan.
      </p>
    </div>
  )
}
