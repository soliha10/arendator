'use client'

import * as React from 'react'
import {
  BadgeCheck, CalendarClock, ChevronDown, CircleAlert, FileText, Gauge,
  PiggyBank, Receipt, ShieldCheck, Wrench,
} from 'lucide-react'
import type { PlanDto } from '@/server/mappers'
import { formatDate, formatMileage, formatMoney, formatPercent, formatTerm } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useLocale, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { ScheduleTable } from './schedule-table'
import { groupByContractYear } from './contract-years'
import { useSelectedPlan } from './selected-plan'

function ConditionRow({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  ok?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon className={cn('mt-0.5 size-4 shrink-0', ok ? 'text-success' : 'text-subtle')} aria-hidden />
      <span className="flex-1 text-[13px] text-muted">{label}</span>
      <span className="text-right text-[13px] font-medium text-text">{value}</span>
    </div>
  )
}

/** Shartnoma yillari bo'yicha: asosiy qarz va ustama ustunlari */
function YearBars({ plan }: { plan: PlanDto }) {
  const t = useMessages().listing.plan
  const locale = useLocale()
  const years = groupByContractYear(plan.schedule)
  const max = Math.max(1, ...years.flatMap((y) => [y.principal, y.markup]))
  const short = (n: number) => formatMoney(n, plan.currency, { compact: true, withSuffix: false, locale })

  return (
    <div
      className={cn(
        'hide-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:overflow-visible',
        years.length >= 3 ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2',
      )}
    >
      {years.map((y) => {
        const equity =
          plan.carPrice > 0
            ? Math.min(100, ((plan.downPayment + (plan.carPrice - plan.downPayment) * (y.paidShare / 100)) / plan.carPrice) * 100)
            : 0
        return (
          <div
            key={y.index}
            className="min-w-60 snap-start rounded-xl bg-surface-2 p-4 sm:min-w-0"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[16px] font-bold text-text">{fmt(t.year, { n: y.index })}</p>
              <span className="tabular whitespace-nowrap rounded-md bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-muted">
                {fmt(t.months, { from: y.fromMonth, to: y.toMonth })}
              </span>
            </div>
            <div className="mt-4 flex h-24 items-end gap-2" aria-hidden>
              <div className="flex-1 rounded-t-md bg-primary" style={{ height: `${Math.max(4, (y.principal / max) * 100)}%` }} />
              <div className="flex-1 rounded-t-md bg-primary/30" style={{ height: `${Math.max(4, (y.markup / max) * 100)}%` }} />
            </div>
            <div className="tabular mt-2 grid grid-cols-2 gap-2 text-center text-[12px] font-semibold text-muted">
              <span>{short(y.principal)}</span>
              <span>{short(y.markup)}</span>
            </div>
            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-[12px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">{t.yearTotal}</dt>
                <dd className="tabular font-semibold text-text">{formatMoney(y.total, plan.currency, { locale })}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">{t.yearEndBalance}</dt>
                <dd className="tabular font-semibold text-text">{formatMoney(y.balanceEnd, plan.currency, { locale })}</dd>
              </div>
              {plan.ownershipTransfer ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t.equity}</dt>
                  <dd className="tabular font-semibold text-success">{formatPercent(equity, 1, locale)}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        )
      })}
    </div>
  )
}

export function PlanViewer({ plans }: { plans: PlanDto[] }) {
  const m = useMessages()
  const t = m.listing.plan
  const locale = useLocale()
  const defaultPlan = plans.find((p) => p.isDefault) ?? plans[0] ?? null
  const selectedId = useSelectedPlan(defaultPlan?.id ?? null)
  const plan = plans.find((p) => p.id === selectedId) ?? defaultPlan
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  if (!plan) return null

  const isRent = plan.planType === 'RENT'
  const money = (n: number | null | undefined) =>
    n === null || n === undefined ? '—' : formatMoney(n, plan.currency, { locale })

  return (
    <section id="shartlar" className="card scroll-offset p-5 sm:p-7" aria-labelledby="amort-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="amort-title" className="text-[22px] font-bold text-text">
            {isRent ? t.titleRent : t.titleFinance}
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            {m.enums.planType[plan.planType]} · {formatTerm(plan.termMonths, locale)} ·{' '}
            {fmt(t.perMonthSuffix, { amount: formatMoney(plan.monthlyPayment, plan.currency, { locale }) })}
            {plans.length > 1 ? t.chooseOther : ''}
          </p>
        </div>
        {!isRent ? (
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-text">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary" aria-hidden /> {t.principal}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary/30" aria-hidden /> {t.markup}
              {plan.markupPercent > 0 ? ` (${formatPercent(plan.markupPercent, 1, locale)})` : ''}
            </span>
          </div>
        ) : null}
      </div>

      {!isRent && plan.schedule.length > 0 ? (
        <div className="mt-6">
          <YearBars plan={plan} />
        </div>
      ) : null}

      <div className="mt-8">
        <ScheduleTable
          schedule={plan.schedule}
          currency={plan.currency}
          planName={plan.name}
          isRent={isRent}
        />
      </div>

      {/* Shart tafsilotlari — huquqiy nuanslar */}
      <div className="mt-6 rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        >
          <span className="text-[15px] font-semibold text-text">{t.details}</span>
          <ChevronDown className={cn('size-5 text-subtle transition-transform', detailsOpen && 'rotate-180')} aria-hidden />
        </button>
        {detailsOpen ? (
          <div className="border-t border-border px-4 pb-4">
            <div className="grid gap-x-8 sm:grid-cols-2">
              <ConditionRow icon={Receipt} label={t.calcMethod} value={m.enums.calcMethod[plan.calcMethod]} />
              <ConditionRow icon={Receipt} label={t.paymentDay} value={fmt(t.paymentDayValue, { day: plan.paymentDay })} />
              {plan.startDate ? (
                <ConditionRow icon={CalendarClock} label={t.startDate} value={formatDate(plan.startDate)} />
              ) : null}
              <ConditionRow icon={ShieldCheck} label={t.insurance} value={plan.insuranceIncluded ? t.included : t.separate} ok={plan.insuranceIncluded} />
              <ConditionRow icon={ShieldCheck} label={t.casco} value={plan.cascoIncluded ? t.included : t.no} ok={plan.cascoIncluded} />
              <ConditionRow icon={Wrench} label={t.maintenance} value={plan.maintenanceIncluded ? t.included : t.ownerPays} ok={plan.maintenanceIncluded} />
              {plan.depositAmount ? <ConditionRow icon={PiggyBank} label={t.deposit} value={money(plan.depositAmount)} /> : null}
              {plan.mileageLimitPerYear ? (
                <ConditionRow
                  icon={Gauge}
                  label={t.kmLimit}
                  value={`${formatMileage(plan.mileageLimitPerYear, locale)}${plan.extraMileageFee ? fmt(t.kmExtra, { fee: money(plan.extraMileageFee) }) : ''}`}
                />
              ) : null}
              <ConditionRow icon={BadgeCheck} label={t.earlyPayoff} value={plan.earlyPayoffAllowed ? t.allowed : t.notAllowed} ok={plan.earlyPayoffAllowed} />
              {plan.penaltyPerDay ? (
                <ConditionRow icon={CircleAlert} label={t.penalty} value={fmt(t.perDay, { amount: money(plan.penaltyPerDay) })} />
              ) : null}
            </div>
            {plan.requiredDocuments ? (
              <div className="mt-3 flex gap-3 rounded-xl bg-surface-2 p-4">
                <FileText className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
                <div>
                  <p className="text-[13px] font-semibold text-text">{t.documents}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{plan.requiredDocuments}</p>
                </div>
              </div>
            ) : null}
            {plan.notes ? (
              <p className="mt-3 rounded-xl bg-warning-soft px-4 py-3 text-[13px] leading-relaxed text-warning">
                {plan.notes}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
