'use client'

import * as React from 'react'
import {
  ArrowRight, BadgeCheck, Banknote, CalendarClock, Info, KeyRound, Send, ShieldCheck,
} from 'lucide-react'
import type { Currency } from '@prisma/client'
import type { PlanDto } from '@/server/mappers'
import { computePlan } from '@/lib/finance'
import { CURRENCY_PRECISION } from '@/lib/constants'
import { currencyLabel, formatMileage, formatMoney, formatPercent, formatTerm } from '@/lib/format'
import { telegramUrl } from '@/lib/site'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { useLocale, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import type { Messages } from '@/i18n/messages'
import { CallButton } from './call-button'
import { goToLeadForm, selectPlan, useSelectedPlan } from './selected-plan'

type Tab = 'finance' | 'rent' | 'cash'

export interface CashInfo {
  hasCashSale: boolean
  cashPrice: number | null
  cashCurrency: Currency
  isNegotiable: boolean
  cashPriceUzs: number | null
  previousPriceUzs: number | null
}

/** Shartlarni muddat bo'yicha chiplarga ajratadi (bir muddatda bir nechta bo'lsa — turi bilan) */
function termChips(plans: PlanDto[], m: Messages) {
  const t = m.listing.finance
  const counts = new Map<number, number>()
  for (const p of plans) counts.set(p.termMonths, (counts.get(p.termMonths) ?? 0) + 1)
  return [...plans]
    .sort((a, b) => a.termMonths - b.termMonths || a.monthlyPayment - b.monthlyPayment)
    .map((p) => ({
      id: p.id,
      label:
        (counts.get(p.termMonths) ?? 0) > 1
          ? fmt(t.termChipTyped, { n: p.termMonths, type: m.enums.planType[p.planType] })
          : fmt(t.termChip, { n: p.termMonths }),
    }))
}

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'success' | 'muted' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd
        className={cn(
          'tabular text-right text-[13px] font-semibold',
          tone === 'success' ? 'text-success' : tone === 'muted' ? 'text-muted' : 'text-text',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function Chips({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string }[]
  activeId: string | undefined
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          aria-pressed={c.id === activeId}
          className={cn(
            'tabular inline-flex min-h-10 items-center rounded-lg px-3.5 text-[13px] font-semibold transition-colors lg:min-h-9',
            c.id === activeId
              ? 'bg-primary text-primary-fg shadow-sm'
              : 'bg-surface-2 text-text hover:bg-surface-3',
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

export function FinanceWidget({
  listingId,
  plans,
  cash,
  telegram,
  isOwner,
}: {
  listingId: string
  plans: PlanDto[]
  cash: CashInfo
  telegram: string | null
  isOwner: boolean
}) {
  const t = useMessages().listing.finance
  const financePlans = plans.filter((p) => p.planType !== 'RENT')
  const rentPlans = plans.filter((p) => p.planType === 'RENT')

  const tabs: { id: Tab; label: string }[] = [
    ...(financePlans.length ? [{ id: 'finance' as const, label: t.tabFinance }] : []),
    ...(rentPlans.length ? [{ id: 'rent' as const, label: t.tabRent }] : []),
    ...(cash.hasCashSale && cash.cashPrice ? [{ id: 'cash' as const, label: t.tabCash }] : []),
  ]

  const defaultPlan = plans.find((p) => p.isDefault) ?? plans[0] ?? null
  const selectedId = useSelectedPlan(defaultPlan?.id ?? null)
  const selected = plans.find((p) => p.id === selectedId) ?? defaultPlan

  const [tab, setTab] = React.useState<Tab>(
    selected?.planType === 'RENT' ? 'rent' : tabs[0]?.id ?? 'cash',
  )

  // Tanlangan shart boshqa joydan (ariza formasi) o'zgarsa, tab ham moslashadi
  const selectedType = selected?.planType
  const [syncedType, setSyncedType] = React.useState(selectedType)
  if (selectedType !== syncedType) {
    setSyncedType(selectedType)
    if (selectedType === 'RENT' && tab !== 'rent') setTab('rent')
    if (selectedType && selectedType !== 'RENT' && tab === 'rent') setTab('finance')
  }

  const pool = tab === 'rent' ? rentPlans : financePlans
  const plan = selected && pool.some((p) => p.id === selected.id) ? selected : pool[0]

  const switchTab = (t: Tab) => {
    setTab(t)
    const nextPool = t === 'rent' ? rentPlans : t === 'finance' ? financePlans : []
    if (nextPool.length && !nextPool.some((p) => p.id === selected?.id)) {
      selectPlan(nextPool[0].id)
    }
  }

  return (
    <section className="card overflow-hidden p-5 sm:p-6" aria-labelledby="fin-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="fin-title" className="text-[19px] font-bold text-text">
          {t.title}
        </h2>
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
          {t.badge}
        </span>
      </div>

      {tabs.length > 1 ? (
        <div
          role="tablist"
          className="mt-4 grid gap-1 rounded-xl bg-surface-2 p-1"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => switchTab(t.id)}
              className={cn(
                'min-h-10 rounded-lg px-2 text-[13px] font-semibold leading-tight transition-colors',
                tab === t.id ? 'bg-primary text-primary-fg shadow-sm' : 'text-text hover:bg-surface-3',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        {tab === 'cash' ? (
          <CashPanel cash={cash} />
        ) : plan ? (
          tab === 'rent' ? (
            <RentPanel plan={plan} plans={rentPlans} />
          ) : (
            <FinancePanel key={plan.id} plan={plan} plans={financePlans} />
          )
        ) : (
          <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">
            {t.noPlans}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-2.5">
        {!isOwner ? (
          <button
            type="button"
            onClick={() => goToLeadForm(tab === 'cash' ? null : plan?.id ?? null)}
            className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[16px] font-semibold text-primary-fg shadow-sm transition-colors hover:bg-primary-hover"
          >
            {t.apply} <ArrowRight className="size-5" aria-hidden />
          </button>
        ) : null}
        <div className={cn('grid gap-2', telegram ? 'grid-cols-2' : 'grid-cols-1')}>
          <CallButton listingId={listingId} variant="outline" className="h-11" label={t.call} />
          {telegram ? (
            <a
              href={telegramUrl(telegram)}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => track('telegram_click', { listing_id: listingId })}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary-soft px-3 text-[13px] font-semibold text-primary transition-colors hover:brightness-95"
            >
              <Send className="size-4" aria-hidden /> {t.telegram}
            </a>
          ) : null}
        </div>
        <p className="pt-1 text-center text-[12px] leading-relaxed text-subtle">
          {t.disclaimer}
        </p>
      </div>
    </section>
  )
}

/** Muddatli to'lov / lizing: boshlang'ich to'lovni o'zgartirib ko'rish mumkin */
function FinancePanel({ plan, plans }: { plan: PlanDto; plans: PlanDto[] }) {
  const m = useMessages()
  const t = m.listing.finance
  const locale = useLocale()
  const basePercent = Math.round(plan.downPaymentPercent)
  const [percent, setPercent] = React.useState(basePercent)
  const maxPercent = Math.max(basePercent, 70)
  const money = (n: number) => formatMoney(n, plan.currency, { locale })
  const included = (v: boolean) => (v ? t.included : t.separate)

  const changed = percent !== basePercent
  const calc = React.useMemo(() => {
    if (!changed) {
      return {
        down: plan.downPayment,
        monthly: plan.monthlyPayment,
        total: plan.totalPayable,
        markup: plan.markupAmount,
      }
    }
    // Diler stavkasi (samarali yillik) saqlanadi, faqat qarz summasi o'zgaradi
    const down = Math.round((plan.carPrice * percent) / 100)
    const r = computePlan({
      carPrice: plan.carPrice,
      downPayment: down,
      termMonths: plan.termMonths,
      method: 'ANNUITY',
      annualRatePercent: plan.markupPercent,
      precision: CURRENCY_PRECISION[plan.currency],
    })
    return { down, monthly: r.monthlyPayment, total: r.totalPayable, markup: r.markupAmount }
  }, [changed, percent, plan])

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <label htmlFor="down-range" className="text-[14px] font-medium text-text">
          {t.downPayment}
        </label>
        <p className="tabular text-right text-[17px] font-bold leading-tight text-primary">
          {money(calc.down)} <span className="text-[14px]">({percent}%)</span>
        </p>
      </div>
      <input
        id="down-range"
        type="range"
        min={basePercent}
        max={maxPercent}
        step={1}
        value={percent}
        onChange={(e) => setPercent(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer accent-[var(--primary)]"
        aria-valuetext={`${percent}% — ${money(calc.down)}`}
      />
      <div className="tabular mt-1.5 flex justify-between text-[11px] text-subtle">
        <span>{fmt(t.minPercent, { n: basePercent })}</span>
        <span>{maxPercent}%</span>
      </div>

      <p className="mt-4 text-[14px] font-medium text-text">{t.term}</p>
      <div className="mt-2">
        <Chips items={termChips(plans, m)} activeId={plan.id} onSelect={(id) => selectPlan(id)} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-2 px-3.5 py-2.5">
        <span className="text-[13px] text-text">{fmt(t.rateLabel, { type: m.enums.planType[plan.planType] })}</span>
        <span className="tabular text-[14px] font-bold text-success">
          {plan.markupPercent > 0 ? fmt(t.rateValue, { rate: formatPercent(plan.markupPercent, 1, locale) }) : t.rateZero}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-primary-soft/70 p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.monthlyTitle}</p>
        <p className="font-display tabular mt-1 text-[34px] font-extrabold leading-none text-primary sm:text-[38px]">
          {formatMoney(calc.monthly, plan.currency, { withSuffix: false, locale })}
          <span className="ml-1.5 text-[15px] font-semibold">{fmt(t.perMonth, { currency: currencyLabel(plan.currency, locale) })}</span>
        </p>
        <dl className="mt-3 border-t border-primary/15 pt-2">
          <Row label={t.total} value={money(calc.total)} />
          <Row label={t.markup} value={calc.markup > 0 ? money(calc.markup) : t.none} tone={calc.markup > 0 ? undefined : 'success'} />
          <Row label={t.insurance} value={included(plan.insuranceIncluded)} tone={plan.insuranceIncluded ? 'success' : 'muted'} />
          <Row label={t.casco} value={plan.cascoIncluded ? t.included : t.none} tone={plan.cascoIncluded ? 'success' : 'muted'} />
          <Row
            label={t.ownership}
            value={plan.ownershipTransfer ? t.ownershipYes : t.ownershipNo}
            tone={plan.ownershipTransfer ? 'success' : 'muted'}
          />
        </dl>
      </div>

      {changed ? (
        <p className="mt-3 flex gap-2 text-[12px] leading-relaxed text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          {fmt(t.estimate, { percent })}
        </p>
      ) : null}
    </div>
  )
}

function RentPanel({ plan, plans }: { plan: PlanDto; plans: PlanDto[] }) {
  const m = useMessages()
  const t = m.listing.finance
  const locale = useLocale()
  const money = (n: number) => formatMoney(n, plan.currency, { locale })
  return (
    <div>
      {plans.length > 1 ? (
        <>
          <p className="text-[14px] font-medium text-text">{t.rentTerm}</p>
          <div className="mt-2">
            <Chips items={termChips(plans, m)} activeId={plan.id} onSelect={(id) => selectPlan(id)} />
          </div>
        </>
      ) : null}

      <div className={cn('grid gap-2', plan.dailyPayment ? 'grid-cols-2' : 'grid-cols-1', plans.length > 1 && 'mt-4')}>
        {plan.dailyPayment ? (
          <div className="rounded-xl bg-primary-soft/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.daily}</p>
            <p className="font-display tabular mt-1 text-[22px] font-extrabold leading-tight text-primary">
              {formatMoney(plan.dailyPayment, plan.currency, { compact: true, locale })}
            </p>
            <p className="text-[12px] text-muted">{t.perDayHint}</p>
          </div>
        ) : null}
        <div className="rounded-xl bg-primary-soft/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.monthlyRent}</p>
          <p className="font-display tabular mt-1 text-[22px] font-extrabold leading-tight text-primary">
            {formatMoney(plan.monthlyPayment, plan.currency, { compact: !!plan.dailyPayment, locale })}
          </p>
          <p className="text-[12px] text-muted">{fmt(t.forTerm, { term: formatTerm(plan.termMonths, locale) })}</p>
        </div>
      </div>

      <dl className="mt-4 rounded-xl bg-surface-2 px-4 py-2">
        <Row label={t.advance} value={plan.downPayment > 0 ? money(plan.downPayment) : t.none} />
        <Row label={t.deposit} value={plan.depositAmount ? money(plan.depositAmount) : t.none} />
        {plan.mileageLimitPerYear ? (
          <Row
            label={t.kmLimit}
            value={formatMileage(plan.mileageLimitPerYear, locale)}
          />
        ) : null}
        <Row label={t.insuranceCasco} value={plan.insuranceIncluded || plan.cascoIncluded ? t.includedShort : t.separateShort} tone={plan.insuranceIncluded || plan.cascoIncluded ? 'success' : 'muted'} />
        <Row label={t.maintenance} value={plan.maintenanceIncluded ? t.includedShort : t.maintenanceTenant} tone={plan.maintenanceIncluded ? 'success' : 'muted'} />
        <Row label={t.rentTotal} value={money(plan.totalPayable)} />
      </dl>

      <div
        className={cn(
          'mt-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-snug',
          plan.ownershipTransfer
            ? 'border-success/30 bg-success-soft text-success'
            : 'border-border text-muted',
        )}
      >
        <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
        {plan.ownershipTransfer
          ? t.rentToOwn
          : t.rentPlain}
      </div>
    </div>
  )
}

function CashPanel({ cash }: { cash: CashInfo }) {
  const t = useMessages().listing.finance
  const locale = useLocale()
  const dropped =
    cash.previousPriceUzs !== null && cash.cashPriceUzs !== null && cash.previousPriceUzs > cash.cashPriceUzs
  return (
    <div>
      <div className="rounded-xl bg-primary-soft/70 p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t.cashTitle}</p>
        {dropped ? (
          <p className="tabular mt-1 text-[13px] text-subtle line-through">
            {formatMoney(cash.previousPriceUzs, 'UZS', { locale })}
          </p>
        ) : null}
        <p className="font-display tabular mt-0.5 text-[32px] font-extrabold leading-tight text-primary">
          {formatMoney(cash.cashPrice, cash.cashCurrency, { locale })}
        </p>
        {cash.cashCurrency === 'USD' && cash.cashPriceUzs ? (
          <p className="tabular text-[13px] text-muted">≈ {formatMoney(cash.cashPriceUzs, 'UZS', { locale })}</p>
        ) : null}
      </div>
      <ul className="mt-4 space-y-2 text-[13px] text-muted">
        <li className="flex items-start gap-2">
          <Banknote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {cash.isNegotiable ? t.negotiable : t.fixed}
        </li>
        <li className="flex items-start gap-2">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t.notary}
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t.payAfter}
        </li>
        <li className="flex items-start gap-2">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {t.viewing}
        </li>
      </ul>
    </div>
  )
}
