'use client'

import * as React from 'react'
import { CalendarClock, Car, KeyRound, Search, SlidersHorizontal } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Link, useLocale, useMessages, useRouter } from '@/i18n/client'
import { plural } from '@/i18n/format'
import { countListingsAction } from './actions'

export interface HeroBrand {
  slug: string
  name: string
  models: { slug: string; name: string }[]
}

const TABS = [
  { value: '', key: 'tabAll', icon: Car },
  { value: 'RENT', key: 'tabRent', icon: KeyRound },
  { value: 'INSTALLMENT', key: 'tabInstallment', icon: CalendarClock },
] as const

const POPULAR = [
  { key: 'popularOnix', href: '/elonlar?q=Onix&transmission=AUTOMATIC' },
  { key: 'popularTracker', href: '/elonlar?q=Tracker' },
  { key: 'popularByd', href: '/elonlar?brand=byd&planType=INSTALLMENT' },
  { key: 'popularDaily', href: '/elonlar?planType=RENT&sort=monthly_asc' },
  { key: 'popularMonthly', href: '/elonlar?monthlyMax=5000000&sort=monthly_asc' },
  { key: 'popularDrops', href: '/elonlar?priceDrop=1' },
] as const

const CURRENT_YEAR = new Date().getFullYear()

/** "45 000 000" kabi kiritilgan matnni raqamga aylantiradi */
const parseMoney = (v: string) => {
  const n = Number(v.replace(/\D/g, ''))
  return Number.isFinite(n) && n > 0 ? n : undefined
}
const groupDigits = (v: string) => {
  const n = parseMoney(v)
  return n ? formatMoney(n, 'UZS', { withSuffix: false }) : ''
}

const fieldClass =
  'h-11 w-full rounded-lg border border-transparent bg-surface px-3 text-sm text-text placeholder:text-subtle transition-colors hover:border-border focus:border-primary'
const labelClass = 'mb-1.5 block text-[11px] font-semibold tracking-wide text-muted'

export function HeroSearch({ brands, total }: { brands: HeroBrand[]; total: number }) {
  const router = useRouter()
  const t = useMessages().home.search
  const locale = useLocale()
  const [deal, setDeal] = React.useState<string>('')
  const [brand, setBrand] = React.useState('')
  const [model, setModel] = React.useState('')
  const [yearMin, setYearMin] = React.useState('')
  const [yearMax, setYearMax] = React.useState('')
  const [downMax, setDownMax] = React.useState('')
  const [monthlyMax, setMonthlyMax] = React.useState('')
  // Oxirgi olingan son — qaysi so'rov uchun ekani bilan
  const [fetched, setFetched] = React.useState<{ query: string; n: number } | null>(null)

  const models = brands.find((b) => b.slug === brand)?.models ?? []

  const query = React.useMemo(() => {
    const p = new URLSearchParams()
    if (deal) p.set('planType', deal)
    if (brand) p.set('brand', brand)
    if (model) p.set('model', model)
    if (yearMin) p.set('yearMin', yearMin)
    if (yearMax) p.set('yearMax', yearMax)
    const down = parseMoney(downMax)
    const monthly = parseMoney(monthlyMax)
    if (down) p.set('downMax', String(down))
    if (monthly) p.set('monthlyMax', String(monthly))
    return p.toString()
  }, [deal, brand, model, yearMin, yearMax, downMax, monthlyMax])

  // Shartlar o'zgarganda mos e'lonlar sonini yangilaymiz (kechiktirib)
  React.useEffect(() => {
    if (!query) return
    let cancelled = false
    const t = setTimeout(() => {
      countListingsAction(query)
        .then((n) => {
          if (!cancelled) setFetched({ query, n })
        })
        .catch(() => {})
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query])

  // Javob kelguncha oldingi son ko'rinib turadi (sakrab ketmasin)
  const count = !query ? total : (fetched?.n ?? total)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(query ? `/elonlar?${query}` : '/elonlar')
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl bg-surface-2 p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)] sm:p-6"
      aria-label={t.aria}
    >
      <div
        role="tablist"
        aria-label={t.dealAria}
        className="hide-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-border-strong/30 px-1 pb-4"
      >
        {TABS.map((tab) => {
          const active = deal === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDeal(tab.value)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors sm:px-6',
                active
                  ? 'bg-primary text-primary-fg shadow-sm'
                  : 'bg-surface text-text hover:bg-surface-3',
              )}
            >
              <tab.icon className="size-4" aria-hidden />
              {t[tab.key]}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1.1fr_1fr_1fr_1fr] lg:items-end lg:gap-4">
        <div>
          <label htmlFor="hs-brand" className={labelClass}>{t.brand}</label>
          <select
            id="hs-brand"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value)
              setModel('')
            }}
            className={cn(fieldClass, 'appearance-none')}
          >
            <option value="">{t.allBrands}</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hs-model" className={labelClass}>{t.model}</label>
          <select
            id="hs-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!brand}
            className={cn(fieldClass, 'appearance-none disabled:opacity-60')}
          >
            <option value="">{brand ? t.allModels : t.pickBrandFirst}</option>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
          <span className={labelClass}>{t.year}</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1990}
              max={CURRENT_YEAR + 1}
              value={yearMin}
              onChange={(e) => setYearMin(e.target.value)}
              placeholder="2018"
              aria-label={t.yearFrom}
              className={cn(fieldClass, 'tabular')}
            />
            <input
              type="number"
              inputMode="numeric"
              min={1990}
              max={CURRENT_YEAR + 1}
              value={yearMax}
              onChange={(e) => setYearMax(e.target.value)}
              placeholder={String(CURRENT_YEAR)}
              aria-label={t.yearTo}
              className={cn(fieldClass, 'tabular')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="hs-down" className={labelClass}>{t.down}</label>
          <input
            id="hs-down"
            inputMode="numeric"
            value={downMax}
            onChange={(e) => setDownMax(groupDigits(e.target.value))}
            placeholder={t.downPlaceholder}
            className={cn(fieldClass, 'tabular')}
          />
        </div>

        <div>
          <label htmlFor="hs-monthly" className={labelClass}>{t.monthly}</label>
          <input
            id="hs-monthly"
            inputMode="numeric"
            value={monthlyMax}
            onChange={(e) => setMonthlyMax(groupDigits(e.target.value))}
            placeholder={t.monthlyPlaceholder}
            className={cn(fieldClass, 'tabular')}
          />
        </div>

        <button
          type="submit"
          className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm transition-colors hover:bg-primary-hover md:col-span-1"
        >
          <Search className="size-4" aria-hidden />
          <span className="tabular">{plural(locale, count, t.cars)}</span>
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border-strong/30 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="hide-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1">
          <span className="shrink-0 text-[11px] font-medium text-muted">{t.popularLabel}</span>
          {POPULAR.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="shrink-0 whitespace-nowrap rounded-md bg-surface px-2.5 py-1 text-[11px] font-semibold text-text transition-colors hover:text-primary"
            >
              {t[p.key]}
            </Link>
          ))}
        </div>
        <Link
          href="/elonlar"
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden /> {t.advanced}
        </Link>
      </div>
    </form>
  )
}
