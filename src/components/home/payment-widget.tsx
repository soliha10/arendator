'use client'

import * as React from 'react'
import { ArrowRight, Car } from 'lucide-react'
import { annuityPayment } from '@/lib/finance'
import { currencyLabel, formatMoney } from '@/lib/format'
import { Link, useLocale, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { cn } from '@/lib/utils'
import { countListingsAction } from './actions'

const DOWN_OPTIONS = [10, 20, 30, 50]
const TERM_OPTIONS = [12, 24, 36, 48]
const STEP = 5_000_000

const roundTo = (v: number, step: number) => Math.round(v / step) * step

/**
 * Bosh sahifadagi "oylik to'lovni hisoblang" vidjeti.
 * Stavka — platformadagi faol shartlarning o'rtachasi (taxminiy),
 * natija esa shu oylik to'lovga mos e'lonlar katalogiga olib boradi.
 */
export function PaymentWidget({
  priceMin,
  priceMax,
  ratePercent,
  minLabel,
  maxLabel,
}: {
  priceMin: number
  priceMax: number
  ratePercent: number
  /**
   * Qisqa formatdagi chegaralar serverda tayyorlanadi: Node va brauzerning
   * ICU'si o'nlik ajratgichni har xil beradi (1.42 / 1,42) — hydration xatosi.
   */
  minLabel: string
  maxLabel: string
}) {
  const min = Math.max(STEP, roundTo(priceMin, STEP))
  const max = Math.max(min + STEP * 10, roundTo(priceMax, STEP))
  const t = useMessages().home.calc
  const locale = useLocale()
  const money = (v: number) => formatMoney(v, 'UZS', { locale })
  const [price, setPrice] = React.useState(() =>
    Math.min(max, Math.max(min, 220_000_000)),
  )
  const [downPct, setDownPct] = React.useState(20)
  const [term, setTerm] = React.useState(36)
  const [count, setCount] = React.useState<number | null>(null)

  const down = Math.round((price * downPct) / 100)
  const principal = price - down
  const monthly = Math.round(annuityPayment(principal, ratePercent, term))
  const total = down + monthly * term

  // Xaridor ±10% oralig'idagi to'lovlarni ham ko'rmoqchi bo'ladi
  const monthlyCap = roundTo(monthly * 1.1, 100_000)
  const href = `/elonlar?monthlyMax=${monthlyCap}&downMax=${roundTo(down * 1.1, 1_000_000)}&sort=monthly_asc`

  React.useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      countListingsAction(`monthlyMax=${monthlyCap}&downMax=${roundTo(down * 1.1, 1_000_000)}`)
        .then((n) => {
          if (!cancelled) setCount(n)
        })
        .catch(() => {})
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [monthlyCap, down])

  const fill = ((price - min) / (max - min)) * 100

  return (
    <div className="grid gap-5 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:p-8">
      <div className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="pw-price" className="text-[13px] font-medium text-muted">
              {t.price}
            </label>
            <span className="font-display tabular text-[20px] font-extrabold text-text">
              {money(price)}
            </span>
          </div>
          <input
            id="pw-price"
            type="range"
            min={min}
            max={max}
            step={STEP}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--primary)]"
            style={{
              background: `linear-gradient(to right, var(--primary) ${fill}%, var(--surface-3) ${fill}%)`,
            }}
          />
          <div className="mt-1.5 flex justify-between text-[11px] text-subtle">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium text-muted">{t.down}</span>
            <span className="tabular text-[14px] font-bold text-primary">
              {money(down)} ({downPct}%)
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2" role="group" aria-label={t.downAria}>
            {DOWN_OPTIONS.map((p) => (
              <Chip key={p} active={downPct === p} onClick={() => setDownPct(p)}>
                {p}%
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[13px] font-medium text-muted">{t.term}</span>
          <div className="mt-2 grid grid-cols-4 gap-2" role="group" aria-label={t.term}>
            {TERM_OPTIONS.map((months) => (
              <Chip key={months} active={term === months} onClick={() => setTerm(months)}>
                {fmt(t.termChip, { n: months })}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-xl bg-surface-2 p-5" aria-live="polite">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {t.estimate}
        </p>
        <p className="mt-2 text-[13px] text-muted">{t.monthly}</p>
        <p className="font-display tabular mt-0.5 text-[34px] font-extrabold leading-none text-primary sm:text-[40px]">
          {formatMoney(monthly, 'UZS', { withSuffix: false, locale })}
          <span className="ml-1.5 text-[15px] font-bold">{fmt(t.perMonth, { currency: currencyLabel('UZS', locale) })}</span>
        </p>

        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-[13px]">
          <Row label={t.remaining} value={money(principal)} />
          <Row label={t.rate} value={`~${ratePercent}%`} tone="success" />
          <Row label={t.total} value={money(total)} />
        </dl>

        <Link
          href={href}
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-semibold text-primary-fg shadow-sm transition-colors hover:bg-primary-hover"
        >
          <Car className="size-4" aria-hidden />
          <span>
            <span className="sm:hidden">{t.matchingShort}</span>
            <span className="hidden sm:inline">{t.matchingLong}</span>
            {count !== null ? ` (${count})` : ''}
          </span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-subtle">
          {t.note}
        </p>
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'tabular h-10 rounded-lg text-[13px] font-semibold transition-colors',
        active ? 'bg-primary text-primary-fg shadow-sm' : 'bg-surface-2 text-text hover:bg-surface-3',
      )}
    >
      {children}
    </button>
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn('tabular font-semibold', tone === 'success' ? 'text-success' : 'text-text')}>
        {value}
      </dd>
    </div>
  )
}
