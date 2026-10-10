'use client'

import * as React from 'react'
import {
  Calculator, CheckCircle2, ChevronDown, Download, Info, Search, SlidersHorizontal, XCircle,
} from 'lucide-react'
import type { Currency } from '@prisma/client'
import { CURRENCY_PRECISION } from '@/lib/constants'
import { currencyLabel, formatMoney, formatPercent, formatTerm } from '@/lib/format'
import { Link, useLocale, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/messages'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { ScheduleRowDto } from '@/server/mappers'
import { ScheduleTable } from '@/components/listing/schedule-table'
import { groupByContractYear } from '@/components/listing/contract-years'
import { SCHEMES, computeScheme, type SchemeId, type SchemeResult } from './schemes'

const TERMS = [12, 24, 36, 48, 60] as const

export interface CalcInitial {
  price: number
  currency: Currency
  downPercent: number
  term: number
  scheme: SchemeId
  rates: Record<SchemeId, number>
  car: string
}

const num = (v: string) => {
  const n = Number(v.replace(/[\s ]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Kiritishda raqamni guruhlab ko'rsatish: "200 000 000" */
const group = (v: string) => {
  const digits = v.replace(/[^\d]/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

type CalcText = Messages['calculator']

export function Calc({ initial, usdRate }: { initial: CalcInitial; usdRate: number }) {
  const t = useMessages().calculator
  const locale = useLocale()
  const [car, setCar] = React.useState(initial.car)
  const [currency, setCurrency] = React.useState<Currency>(initial.currency)
  const [priceText, setPriceText] = React.useState(group(String(initial.price)))
  const [downPercent, setDownPercent] = React.useState(initial.downPercent)
  const [term, setTerm] = React.useState(initial.term)
  const [rates, setRates] = React.useState(initial.rates)
  const [schemeId, setSchemeId] = React.useState<SchemeId>(initial.scheme)
  const [ratesOpen, setRatesOpen] = React.useState(false)
  const [tableMode, setTableMode] = React.useState<'year' | 'month'>('year')

  const price = num(priceText)
  const precision = CURRENCY_PRECISION[currency]

  // Holat URL'da — hisobni havola orqali ulashish mumkin
  const touched = React.useRef(false)
  React.useEffect(() => {
    const qs = new URLSearchParams({
      narx: String(price),
      v: currency,
      bosh: String(downPercent),
      muddat: String(term),
      sxema: schemeId,
      r1: String(rates.rassrochka),
      r2: String(rates.lizing),
      r3: String(rates.arenda),
      ...(car.trim() ? { avto: car.trim() } : {}),
    })
    window.history.replaceState(null, '', `${window.location.pathname}?${qs.toString()}`)
  }, [price, currency, downPercent, term, schemeId, rates, car])

  const markUsed = () => {
    if (touched.current) return
    touched.current = true
    track('calculator_use')
  }

  const results = React.useMemo(() => {
    if (price <= 0) return null
    return SCHEMES.map((def) =>
      computeScheme(def, { price, downPercent, term, rate: rates[def.id], precision }),
    )
  }, [price, downPercent, term, rates, precision])

  const money = (n: number) => formatMoney(n, currency, { locale })
  const selected = results?.find((r) => r.def.id === schemeId) ?? results?.[0] ?? null
  const cheapest = results
    ? results.reduce((a, b) => (b.plan.totalPayable < a.plan.totalPayable ? b : a))
    : null
  const lowestMonthly = results
    ? results.reduce((a, b) => (b.plan.monthlyPayment < a.plan.monthlyPayment ? b : a))
    : null

  const toUzs = (n: number) => (currency === 'USD' ? n * usdRate : n)
  const findHref = selected
    ? `/elonlar?${new URLSearchParams({
        monthlyMax: String(Math.ceil(toUzs(selected.plan.monthlyPayment) * 1.1 / 100_000) * 100_000),
        downMax: String(Math.ceil(toUzs(selected.down) * 1.1 / 1_000_000) * 1_000_000),
        planType: selected.def.id === 'arenda' ? 'RENT' : 'INSTALLMENT,LEASING',
      }).toString()}`
    : '/elonlar'

  return (
    <div className="calc-root space-y-8">
      {/* Chop etishda sahifaning qolgan qismi (menyu, footer) yashiriladi */}
      <style>{`@media print {
        body * { visibility: hidden; }
        .calc-root, .calc-root * { visibility: visible; }
        .calc-root { position: absolute; inset: 0 auto auto 0; width: 100%; font-size: 12px; }
        .no-print { display: none !important; }
        .card { break-inside: avoid; box-shadow: none !important; }
      }`}</style>

      <div className="flex flex-wrap gap-2.5 no-print sm:justify-end xl:-mt-[4.5rem]">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[14px] font-semibold text-text shadow-sm transition-colors hover:bg-surface-2"
        >
          <Download className="size-4" aria-hidden /> {t.actions.savePdf}
        </button>
        <Link
          href={findHref}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-semibold text-primary-fg shadow-sm transition-colors hover:bg-primary-hover"
        >
          <Search className="size-4" aria-hidden /> {t.actions.findCars}
        </Link>
      </div>

      {/* ── Kiritish + xulosa ─────────────────────────── */}
      <section className="card grid gap-6 p-5 surface-shadow sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5" onChangeCapture={markUsed} onClickCapture={markUsed}>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="text-[13px] font-semibold text-muted">{t.input.car}</span>
              <input
                value={car}
                onChange={(e) => setCar(e.target.value)}
                placeholder={t.input.carPlaceholder}
                maxLength={60}
                className="mt-1.5 h-12 w-full rounded-lg border border-transparent bg-surface-2 px-3.5 text-[15px] font-semibold text-text placeholder:font-normal placeholder:text-subtle focus:border-primary focus:bg-surface"
              />
            </label>
            <label className="block">
              <span className="flex items-center justify-between text-[13px] font-semibold text-muted">
                {t.input.price}
                {price > 0 ? (
                  <span className="tabular text-[12px] font-medium text-subtle">
                    ≈ {currency === 'UZS'
                      ? formatMoney(price / usdRate, 'USD', { compact: true, locale })
                      : formatMoney(price * usdRate, 'UZS', { compact: true, locale })}
                  </span>
                ) : null}
              </span>
              <span className="relative mt-1.5 block">
                <input
                  value={priceText}
                  onChange={(e) => setPriceText(group(e.target.value))}
                  inputMode="numeric"
                  aria-label={t.input.price}
                  className="font-display tabular h-12 w-full rounded-lg border border-transparent bg-surface-2 pl-3.5 pr-14 text-[18px] font-bold text-primary focus:border-primary focus:bg-surface"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-muted">
                  {currency === 'UZS' ? currencyLabel('UZS', locale) : 'USD'}
                </span>
              </span>
            </label>
            <div>
              <span className="text-[13px] font-semibold text-muted">{t.input.currency}</span>
              <div className="mt-1.5 flex h-12 rounded-lg bg-surface-2 p-1">
                {(['UZS', 'USD'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={currency === c}
                    onClick={() => {
                      if (c === currency) return
                      // Narxni yangi valyutaga o'tkazamiz — summa ma'nosi saqlanadi
                      const next = c === 'USD' ? Math.round(price / usdRate) : Math.round((price * usdRate) / 1_000_000) * 1_000_000
                      setCurrency(c)
                      setPriceText(group(String(next)))
                    }}
                    className={cn(
                      'min-w-16 rounded-md px-3 text-[13px] font-semibold transition-colors',
                      currency === c ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-text',
                    )}
                  >
                    {c === 'UZS' ? 'UZS' : 'USD ($)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-surface-2 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="calc-down" className="text-[15px] font-semibold text-text">
                {t.input.down}
              </label>
              <p className="flex items-center gap-2">
                <span className="tabular rounded-md bg-primary px-2 py-0.5 text-[12px] font-bold text-primary-fg">
                  {downPercent}%
                </span>
                <span className="font-display tabular text-[19px] font-bold text-text">
                  {money((price * downPercent) / 100)}
                </span>
              </p>
            </div>
            <input
              id="calc-down"
              type="range"
              min={0}
              max={70}
              step={5}
              value={downPercent}
              onChange={(e) => setDownPercent(Number(e.target.value))}
              className="mt-3 h-2 w-full cursor-pointer accent-[var(--primary)]"
            />
            <div className="tabular mt-1.5 flex justify-between text-[12px] text-muted">
              <span>0%</span>
              <span>{t.input.downTypical}</span>
              <span>70%</span>
            </div>
          </div>

          <div className="rounded-xl bg-surface-2 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[15px] font-semibold text-text">{t.input.term}</p>
              <span className="font-display tabular rounded-md bg-surface-3 px-2.5 py-1 text-[16px] font-bold text-text">
                {fmt(t.input.termValue, { n: term })}<span className="hidden sm:inline"> ({formatTerm(term, locale)})</span>
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {TERMS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={term === m}
                  onClick={() => setTerm(m)}
                  className={cn(
                    'min-h-11 rounded-lg text-[13px] font-semibold transition-colors lg:min-h-10',
                    term === m ? 'bg-primary text-primary-fg shadow-sm' : 'bg-surface text-text hover:bg-surface-3',
                  )}
                >
                  {fmt(t.input.termChip, { years: m / 12, n: m })}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setRatesOpen((v) => !v)}
              aria-expanded={ratesOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-[14px] font-semibold text-text">
                <SlidersHorizontal className="size-4 text-primary" aria-hidden />
                {t.input.rates}
                <span className="text-[12px] font-normal text-muted">{t.input.ratesHint}</span>
              </span>
              <ChevronDown className={cn('size-4 text-subtle transition-transform', ratesOpen && 'rotate-180')} aria-hidden />
            </button>
            {ratesOpen ? (
              <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-3">
                {SCHEMES.map((s) => (
                  <label key={s.id} className="block">
                    <span className="text-[12px] font-medium text-muted">
                      {s.index}. {t.schemes[s.id].rateLabel}
                    </span>
                    <span className="relative mt-1 block">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={rates[s.id]}
                        onChange={(e) =>
                          setRates((r) => ({ ...r, [s.id]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))
                        }
                        className="tabular h-11 w-full rounded-lg border border-border bg-surface pl-3 pr-14 text-[15px] font-semibold text-text"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">{t.input.ratePerYear}</span>
                    </span>
                  </label>
                ))}
                <p className="text-[12px] leading-relaxed text-muted sm:col-span-3">
                  {t.input.ratesNote}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Xulosa */}
        <aside className="rounded-2xl bg-primary-soft/70 p-5 sm:p-6">
          <p className="text-[12px] font-bold uppercase tracking-wider text-primary">{t.summary.label}</p>
          <p className="font-display mt-1 text-[22px] font-bold text-text">
            {car.trim() || t.summary.defaultTitle}
          </p>
          {results && selected ? (
            <>
              <dl className="mt-4 space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3.5 py-3">
                  <dt className="text-[13px] text-muted">{t.summary.financed}</dt>
                  <dd className="font-display tabular text-[16px] font-bold text-text">
                    {money(price - (price * downPercent) / 100)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3.5 py-3">
                  <dt className="text-[13px] text-muted">{t.summary.lowestMonthly}</dt>
                  <dd className="tabular text-right text-[14px] font-bold text-success">
                    {money(lowestMonthly!.plan.monthlyPayment)}
                    <span className="block text-[11px] font-medium text-muted">{t.schemes[lowestMonthly!.def.id].title}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3.5 py-3">
                  <dt className="text-[13px] text-muted">{t.summary.lowestTotal}</dt>
                  <dd className="tabular text-right text-[14px] font-bold text-text">
                    {money(cheapest!.plan.totalPayable)}
                    <span className="block text-[11px] font-medium text-muted">{t.schemes[cheapest!.def.id].title}</span>
                  </dd>
                </div>
              </dl>
              <div className="mt-4 rounded-xl bg-primary p-4 text-primary-fg">
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{t.summary.selected}</p>
                <p className="font-display mt-1 text-[18px] font-bold">{t.schemes[selected.def.id].title}</p>
                <p className="font-display tabular mt-2 text-[26px] font-extrabold leading-none">
                  {formatMoney(selected.plan.monthlyPayment, currency, { withSuffix: false, locale })}
                  <span className="ml-1 text-[13px] font-semibold opacity-80">{fmt(t.summary.perMonth, { currency: currencyLabel(currency, locale) })}</span>
                </p>
                <p className="mt-2 text-[12px] leading-relaxed opacity-85">
                  {fmt(t.summary.selectedHint, {
                    term: formatTerm(term, locale),
                    down: selected.downPercent,
                    over: formatPercent(selected.plan.overpayPercent, 1, locale),
                  })}
                </p>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">{t.summary.enterPrice}</p>
          )}
        </aside>
      </section>

      {results && selected ? (
        <>
          {/* ── 3 sxema ───────────────────────────────── */}
          <section aria-labelledby="schemes-title">
            <p className="text-[12px] font-bold uppercase tracking-wider text-primary">{t.schemesSection.label}</p>
            <h2 id="schemes-title" className="mt-1 text-[26px] font-extrabold text-text sm:text-[32px]">
              {t.schemesSection.title}
            </h2>
            <p className="mt-1 text-[14px] text-muted">{t.schemesSection.hint}</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:items-start">
              {results.map((r) => (
                <SchemeCard
                  key={r.def.id}
                  r={r}
                  money={money}
                  selected={r.def.id === selected.def.id}
                  cheapest={r.def.id === cheapest!.def.id}
                  onSelect={() => setSchemeId(r.def.id)}
                  term={term}
                  t={t}
                  locale={locale}
                />
              ))}
            </div>
          </section>

          {/* ── Grafik ─────────────────────────────────── */}
          <section className="card p-5 sm:p-7" aria-labelledby="chart-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-primary">{t.chart.label}</p>
                <h2 id="chart-title" className="mt-1 text-[22px] font-extrabold text-text sm:text-[26px]">
                  {t.chart.title}
                </h2>
                <p className="mt-1 text-[13px] text-muted">{fmt(t.chart.model, { scheme: t.schemes[selected.def.id].title, n: term })}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-[12px] font-semibold text-text">
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> {t.chart.balance}</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" /> {t.chart.equity}</span>
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <BalanceChart r={selected} price={price} money={money} currency={currency} t={t} locale={locale} />
              <YearIndex r={selected} money={money} t={t} />
            </div>
          </section>

          {/* ── Jadval ─────────────────────────────────── */}
          <section className="card p-5 sm:p-7" aria-labelledby="table-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="table-title" className="text-[22px] font-extrabold text-text sm:text-[26px]">
                  {t.table.title}
                </h2>
                <p className="mt-1 text-[13px] text-muted">{t.schemes[selected.def.id].title} · {selected.def.method === 'FLAT' ? t.table.methodFlat : t.table.methodAnnuity}</p>
              </div>
              <div className="inline-flex rounded-lg bg-surface-2 p-1 no-print">
                {(
                  [
                    ['year', t.table.yearly],
                    ['month', t.table.monthly],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={tableMode === v}
                    onClick={() => setTableMode(v)}
                    className={cn(
                      'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                      tableMode === v ? 'bg-surface text-primary shadow-sm' : 'text-muted',
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              {tableMode === 'year' ? (
                <YearTable r={selected} money={money} t={t} locale={locale} />
              ) : (
                <ScheduleTable
                  schedule={toDto(selected)}
                  currency={currency}
                  planName={selected.def.id}
                />
              )}
            </div>
          </section>

          {/* ── CTA ───────────────────────────────────── */}
          <section className="no-print flex flex-col gap-5 rounded-2xl bg-primary p-6 text-primary-fg shadow-lg sm:flex-row sm:items-center sm:p-8">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-fg/10">
              <Calculator className="size-7" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-extrabold sm:text-[26px]">{t.cta.title}</h2>
              <p className="mt-1 text-[14px] leading-relaxed opacity-90">
                {t.cta.text}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-surface px-5 text-[14px] font-semibold text-primary transition-opacity hover:opacity-90"
              >
                <Download className="size-4" aria-hidden /> {t.cta.pdf}
              </button>
              <Link
                href={findHref}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-fg/10 px-5 text-[14px] font-semibold text-primary-fg ring-1 ring-primary-fg/30 transition-colors hover:bg-primary-fg/20"
              >
                {t.cta.cars}
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

/** Hisobdagi grafikni kartochka/jadval komponentlari kutgan shaklga keltiradi */
function toDto(r: SchemeResult): ScheduleRowDto[] {
  return r.plan.schedule.map((row) => ({
    monthIndex: row.monthIndex,
    dueDate: row.dueDate.toISOString(),
    amount: row.amount,
    principal: row.principal,
    markup: row.markup,
    balanceAfter: row.balanceAfter,
    status: 'PLANNED',
    isCustom: false,
    note: null,
  }))
}

function SchemeCard({
  r,
  money,
  selected,
  cheapest,
  onSelect,
  term,
  t,
  locale,
}: {
  r: SchemeResult
  money: (n: number) => string
  selected: boolean
  cheapest: boolean
  onSelect: () => void
  term: number
  t: CalcText
  locale: Locale
}) {
  const p = r.plan
  const def = t.schemes[r.def.id]
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative rounded-2xl border bg-surface p-5 text-left transition-shadow hover:surface-shadow sm:p-6',
        selected ? 'border-primary ring-2 ring-primary/30 surface-shadow lg:-translate-y-2' : 'border-border',
      )}
    >
      {cheapest ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-fg">
          {t.card.cheapest}
        </span>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-bold uppercase text-muted">
          {fmt(t.card.index, { n: r.def.index })}
        </span>
        <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">{def.tag}</span>
      </div>
      <h3 className="mt-4 text-[22px] font-extrabold leading-tight text-text">{def.title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{def.subtitle}</p>

      <div className={cn('mt-5 rounded-xl p-4', selected ? 'bg-primary-soft' : 'bg-surface-2')}>
        <p className="text-[12px] font-medium text-muted">{t.card.monthly}</p>
        <p className="font-display tabular mt-1 text-[26px] font-extrabold leading-tight text-primary">
          {money(p.monthlyPayment)}
        </p>
      </div>

      <dl className="mt-4 space-y-2 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t.card.down}</dt>
          <dd className="tabular font-semibold text-text">{money(r.down)} ({r.downPercent}%)</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{def.rateLabel}</dt>
          <dd className="tabular font-semibold text-text">{formatPercent(r.rate, 1, locale)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t.card.overpay}</dt>
          <dd className="tabular font-semibold text-text">{money(p.markupAmount)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{t.card.total}</dt>
          <dd className="tabular font-bold text-text">{money(p.totalPayable)}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{t.card.prosCons}</p>
        <ul className="mt-2 space-y-1.5 text-[13px] text-muted">
          {def.pros.map((x) => (
            <li key={x} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {x}
            </li>
          ))}
          {def.cons.map((x) => (
            <li key={x} className="flex gap-2">
              <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /> {x}
            </li>
          ))}
          {r.def.id === 'rassrochka' && term > 24 ? (
            <li className="flex gap-2 text-warning">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {t.card.longFlat}
            </li>
          ) : null}
        </ul>
      </div>
    </button>
  )
}

/** Qoldiq qarz (kamayadi) va egalik qismi (oshadi) — kutubxonasiz SVG */
function BalanceChart({
  r,
  price,
  money,
  currency,
  t,
  locale,
}: {
  r: SchemeResult
  price: number
  money: (n: number) => string
  currency: Currency
  t: CalcText
  locale: Locale
}) {
  const short = (v: number) => formatMoney(v, currency, { compact: true, withSuffix: currency === 'USD', locale })
  const W = 640
  const H = 240
  const rows = r.plan.schedule
  const n = rows.length
  const financed = r.plan.financedAmount
  const points = [{ m: 0, balance: financed }, ...rows.map((row) => ({ m: row.monthIndex, balance: row.balanceAfter }))]
  const x = (m: number) => (m / n) * W
  const y = (v: number) => H - (v / Math.max(price, 1)) * H

  const balancePath = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.m)},${y(p.balance)}`).join(' ')
  const equityPath = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.m)},${y(price - p.balance)}`).join(' ')
  const area = `${balancePath} L${W},${H} L0,${H} Z`
  const yearMarks = points.filter((p) => p.m > 0 && p.m % 12 === 0)

  return (
    <div className="rounded-xl bg-surface-2 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-semibold text-text">{t.chart.amortization}</span>
        <span className="text-muted">{fmt(t.chart.start, { amount: short(financed) })}</span>
      </div>
      <div className="relative mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-56 w-full overflow-visible" role="img" aria-label={t.chart.aria}>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="var(--border)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill="var(--primary)" opacity={0.12} />
          <path d={balancePath} fill="none" stroke="var(--primary)" strokeWidth={3} vectorEffect="non-scaling-stroke" />
          <path d={equityPath} fill="none" stroke="var(--success)" strokeWidth={2.5} strokeDasharray="7 6" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Yil oxiri belgilari HTML'da — SVG cho'zilganda doiralar ellips bo'lib qolmasin */}
        {yearMarks.map((p) => (
          <span
            key={p.m}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(p.m / n) * 100}%`, top: `${(y(p.balance) / H) * 100}%` }}
          >
            <span className="block size-3 rounded-full border-2 border-surface bg-primary shadow" />
            <span
              className={cn(
                'tabular absolute top-3.5 whitespace-nowrap rounded bg-surface/90 px-1 text-[10px] font-semibold text-text',
                p.m === n ? 'right-0' : 'left-1/2 -translate-x-1/2',
              )}
            >
              {fmt(t.chart.yearMark, { n: p.m / 12, amount: short(p.balance) })}
            </span>
          </span>
        ))}
      </div>
      <div className="tabular mt-6 flex justify-between text-[11px] text-muted">
        <span>{t.chart.axisStart}</span>
        {n >= 24 ? <span>{fmt(t.chart.axisMid, { n: Math.round(n / 2) })}</span> : null}
        <span>{fmt(t.chart.axisEnd, { n })}</span>
      </div>
      <p className="sr-only">
        {fmt(t.chart.srSummary, { amount: money(financed), n })}
      </p>
    </div>
  )
}

function YearIndex({ r, money, t }: { r: SchemeResult; money: (n: number) => string; t: CalcText }) {
  const years = groupByContractYear(r.plan.schedule)
  return (
    <div>
      <h3 className="text-[17px] font-bold text-text">{t.index.title}</h3>
      <ul className="mt-4 space-y-4">
        {years.map((y) => {
          const pShare = y.total > 0 ? (y.principal / y.total) * 100 : 100
          return (
            <li key={y.index}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] text-text">{fmt(t.index.yearTotal, { n: y.index })}</span>
                <span className="font-display tabular text-[16px] font-bold text-primary">{money(y.total)}</span>
              </div>
              <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                <div className="bg-primary" style={{ width: `${pShare}%` }} />
                <div className="bg-muted/60" style={{ width: `${100 - pShare}%` }} />
              </div>
              <div className="tabular mt-1 flex justify-between text-[11px] font-medium text-muted">
                <span>{fmt(t.index.principalShare, { n: Math.round(pShare) })}</span>
                <span>{fmt(t.index.interestShare, { n: Math.round(100 - pShare) })}</span>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-5 rounded-xl bg-surface-2 p-4 text-[13px] leading-relaxed text-muted">
        <p className="font-semibold text-text">{t.index.conclusion}</p>
        {t.index.conclusionText} <span className="tabular font-semibold text-text">{money(r.plan.markupAmount)}</span>.
      </div>
    </div>
  )
}

function YearTable({
  r,
  money,
  t,
  locale,
}: {
  r: SchemeResult
  money: (n: number) => string
  t: CalcText
  locale: Locale
}) {
  const years = groupByContractYear(r.plan.schedule)
  const price = r.plan.financedAmount + r.down
  return (
    <>
      <ul className="space-y-2 sm:hidden">
        {years.map((y) => {
          const equity = price > 0 ? ((r.down + (r.plan.financedAmount * y.paidShare) / 100) / price) * 100 : 0
          return (
            <li key={y.index} className="rounded-xl bg-surface-2 p-4">
              <div className="flex items-center justify-between">
                <span className="font-display text-[16px] font-bold text-primary">{fmt(t.table.period, { n: y.index, from: y.fromMonth, to: y.toMonth })}</span>
                <span className="tabular rounded-md bg-surface px-2 py-0.5 text-[11px] font-semibold text-success">
                  {fmt(t.table.equity, { value: formatPercent(equity, 1, locale) })}
                </span>
              </div>
              <dl className="tabular mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                <div><dt className="text-muted">{t.table.monthlyPayment}</dt><dd className="font-semibold text-text">{money(y.total / (y.toMonth - y.fromMonth + 1))}</dd></div>
                <div><dt className="text-muted">{t.table.toPrincipal}</dt><dd className="font-semibold text-success">{money(y.principal)}</dd></div>
                <div><dt className="text-muted">{t.table.interest}</dt><dd className="font-semibold text-danger">{money(y.markup)}</dd></div>
                <div><dt className="text-muted">{t.table.yearEndBalance}</dt><dd className="font-semibold text-text">{money(y.balanceEnd)}</dd></div>
              </dl>
            </li>
          )
        })}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface-2">
            <tr className="text-[12px] font-semibold text-muted">
              <th className="px-4 py-3 text-left">{t.table.colPeriod}</th>
              <th className="px-4 py-3 text-right">{t.table.colMonthlyAvg}</th>
              <th className="px-4 py-3 text-right">{t.table.toPrincipal}</th>
              <th className="px-4 py-3 text-right">{t.table.interest}</th>
              <th className="px-4 py-3 text-right">{t.table.colBalance}</th>
              <th className="px-4 py-3 text-right">{t.table.colEquity}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {years.map((y) => {
              const equity = price > 0 ? ((r.down + (r.plan.financedAmount * y.paidShare) / 100) / price) * 100 : 0
              return (
                <tr key={y.index} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3.5 font-semibold text-primary">{fmt(t.table.period, { n: y.index, from: y.fromMonth, to: y.toMonth })}</td>
                  <td className="tabular px-4 py-3.5 text-right text-text">{money(y.total / (y.toMonth - y.fromMonth + 1))}</td>
                  <td className="tabular px-4 py-3.5 text-right text-text">{money(y.principal)}</td>
                  <td className="tabular px-4 py-3.5 text-right text-danger">{money(y.markup)}</td>
                  <td className="tabular px-4 py-3.5 text-right text-text">{money(y.balanceEnd)}</td>
                  <td className="tabular px-4 py-3.5 text-right font-bold text-success">{formatPercent(equity, 1, locale)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-surface-2">
            <tr className="text-[13px] font-semibold text-text">
              <td className="px-4 py-3">{fmt(t.table.total, { n: r.plan.schedule.length })}</td>
              <td className="px-4 py-3" />
              <td className="tabular px-4 py-3 text-right">{money(r.plan.financedAmount)}</td>
              <td className="tabular px-4 py-3 text-right text-danger">{money(r.plan.markupAmount)}</td>
              <td className="tabular px-4 py-3 text-right" colSpan={2}>
                {fmt(t.table.withDown, { amount: money(r.plan.totalPayable) })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
