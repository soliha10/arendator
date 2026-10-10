'use client'

import * as React from 'react'
import {
  BadgeCheck, CalendarClock, CircleAlert, FileText, Gauge,
  Info, PiggyBank, Receipt, ShieldCheck, Wallet, Wrench,
} from 'lucide-react'
import type { PlanDto } from '@/server/mappers'
import {
  CALC_METHOD_HINTS, CALC_METHOD_LABELS, PLAN_TYPE_HINTS, PLAN_TYPE_LABELS,
} from '@/lib/constants'
import { formatDate, formatMoney, formatPercent, formatTerm } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ScheduleTable } from './schedule-table'

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: 'primary' | 'warning' | 'success'
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 sm:p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle">
        {label}
        {hint ? (
          <Tooltip content={hint}>
            <span className="cursor-help">
              <Info className="size-3" />
            </span>
          </Tooltip>
        ) : null}
      </p>
      <p
        className={cn(
          'tabular mt-1 text-[15px] font-bold leading-tight sm:text-[17px]',
          accent === 'primary' && 'text-primary',
          accent === 'warning' && 'text-warning',
          accent === 'success' && 'text-success',
          !accent && 'text-text',
        )}
      >
        {value}
      </p>
    </div>
  )
}

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
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', ok ? 'text-success' : 'text-subtle')}
      />
      <span className="flex-1 text-[13px] text-muted">{label}</span>
      <span className="text-[13px] font-medium text-text">{value}</span>
    </div>
  )
}

export function PlanViewer({ plans }: { plans: PlanDto[] }) {
  const defaultIndex = Math.max(0, plans.findIndex((p) => p.isDefault))
  const [activeIndex, setActiveIndex] = React.useState(defaultIndex)
  const plan = plans[activeIndex]

  if (!plan) {
    return (
      <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">
        Bu eʼlonga toʻlov sharti qoʻshilmagan.
      </p>
    )
  }

  const money = (n: number | null | undefined) =>
    n === null || n === undefined ? '—' : formatMoney(n, plan.currency)

  const principalShare =
    plan.totalPayable > 0
      ? ((plan.totalPayable - plan.markupAmount) / plan.totalPayable) * 100
      : 100

  return (
    <section id="shartlar" className="card scroll-offset overflow-hidden">
      <div className="border-b border-border px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-lg font-semibold text-text">Toʻlov shartlari</h2>
        <p className="mt-1 text-sm text-muted">
          {plans.length > 1
            ? `Arendator ${plans.length} xil shart taklif qilgan — solishtiring`
            : 'Arendator taklif qilgan shart'}
        </p>

        {/* Shartlar tabi */}
        <div className="hide-scrollbar -mb-px mt-4 flex gap-1 overflow-x-auto">
          {plans.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-current={i === activeIndex}
              className={cn(
                'shrink-0 border-b-2 px-4 py-3 text-left transition-colors',
                i === activeIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-border-strong',
              )}
            >
              <span
                className={cn(
                  'block text-[13px] font-semibold',
                  i === activeIndex ? 'text-primary' : 'text-text',
                )}
              >
                {p.name}
              </span>
              <span className="tabular mt-0.5 block text-[12px] text-muted">
                {formatMoney(p.monthlyPayment, p.currency, { compact: true })}/oy
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={plan.planType === 'RENT' ? 'default' : 'primary'}>
            {PLAN_TYPE_LABELS[plan.planType]}
          </Badge>
          <Tooltip content={CALC_METHOD_HINTS[plan.calcMethod]}>
            <span>
              <Badge variant="default" className="cursor-help">
                <Info /> {CALC_METHOD_LABELS[plan.calcMethod]}
              </Badge>
            </span>
          </Tooltip>
          {plan.ownershipTransfer ? (
            <Badge variant="success">
              <BadgeCheck /> Mulk huquqi oʻtadi
            </Badge>
          ) : (
            <Badge variant="warning">Mulk huquqi oʻtmaydi</Badge>
          )}
        </div>

        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          {PLAN_TYPE_HINTS[plan.planType]}
        </p>

        {/* Asosiy raqamlar */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <StatTile
            label="Boshlangʻich toʻlov"
            value={money(plan.downPayment)}
            hint={`Avtomobil narxining ${formatPercent(plan.downPaymentPercent)} qismi`}
          />
          <StatTile
            label="Oylik toʻlov"
            value={money(plan.monthlyPayment)}
            accent="primary"
            hint={`${formatTerm(plan.termMonths)} davomida har oyning ${plan.paymentDay}-kuni`}
          />
          <StatTile label="Jami toʻlov" value={money(plan.totalPayable)} />
          <StatTile
            label="Ustama"
            value={money(plan.markupAmount)}
            accent="warning"
            hint={
              plan.markupPercent > 0
                ? `Samarali yillik stavka: ${formatPercent(plan.markupPercent, 2)}`
                : 'Ustamasiz'
            }
          />
        </div>

        {/* Asosiy qarz / ustama nisbati */}
        {plan.markupAmount > 0 ? (
          <div className="mt-4">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="bg-primary"
                style={{ width: `${principalShare}%` }}
                aria-hidden
              />
              <div className="flex-1 bg-warning" aria-hidden />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span className="size-2 rounded-full bg-primary" aria-hidden />
                Avtomobil narxi {formatPercent(principalShare)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span className="size-2 rounded-full bg-warning" aria-hidden />
                Ustama {formatPercent(100 - principalShare)}
                {plan.markupPercent > 0
                  ? ` · yillik ${formatPercent(plan.markupPercent, 1)}`
                  : ''}
              </span>
            </div>
          </div>
        ) : null}

        {/* Shart tafsilotlari */}
        <div className="mt-5 grid gap-x-8 gap-y-1 rounded-xl bg-surface-2 px-4 py-2 sm:grid-cols-2">
          <ConditionRow
            icon={CalendarClock}
            label="Muddat"
            value={formatTerm(plan.termMonths)}
          />
          <ConditionRow
            icon={Wallet}
            label="Avtomobil narxi"
            value={money(plan.carPrice)}
          />
          <ConditionRow
            icon={Receipt}
            label="Toʻlov kuni"
            value={`Har oyning ${plan.paymentDay}-kuni`}
          />
          {plan.startDate ? (
            <ConditionRow
              icon={CalendarClock}
              label="Grafik boshlanishi"
              value={formatDate(plan.startDate)}
            />
          ) : null}
          <ConditionRow
            icon={ShieldCheck}
            label="Sugʻurta"
            value={plan.insuranceIncluded ? 'Narxga kiritilgan' : 'Alohida toʻlanadi'}
            ok={plan.insuranceIncluded}
          />
          <ConditionRow
            icon={ShieldCheck}
            label="KASKO"
            value={plan.cascoIncluded ? 'Narxga kiritilgan' : 'Yoʻq'}
            ok={plan.cascoIncluded}
          />
          <ConditionRow
            icon={Wrench}
            label="Texnik xizmat"
            value={plan.maintenanceIncluded ? 'Narxga kiritilgan' : 'Egasi hisobidan'}
            ok={plan.maintenanceIncluded}
          />
          {plan.depositAmount ? (
            <ConditionRow
              icon={PiggyBank}
              label="Zalog"
              value={money(plan.depositAmount)}
            />
          ) : null}
          {plan.mileageLimitPerYear ? (
            <ConditionRow
              icon={Gauge}
              label="Yillik km limiti"
              value={`${plan.mileageLimitPerYear.toLocaleString('uz-UZ')} km${
                plan.extraMileageFee
                  ? ` · ortigʻi ${money(plan.extraMileageFee)}/km`
                  : ''
              }`}
            />
          ) : null}
          <ConditionRow
            icon={BadgeCheck}
            label="Muddatidan oldin yopish"
            value={plan.earlyPayoffAllowed ? 'Mumkin' : 'Mumkin emas'}
            ok={plan.earlyPayoffAllowed}
          />
          {plan.penaltyPerDay ? (
            <ConditionRow
              icon={CircleAlert}
              label="Kechikkanlik jarimasi"
              value={`${money(plan.penaltyPerDay)}/kun`}
            />
          ) : null}
        </div>

        {plan.requiredDocuments ? (
          <div className="mt-4 flex gap-3 rounded-xl border border-border p-4">
            <FileText className="mt-0.5 size-4 shrink-0 text-subtle" />
            <div>
              <p className="text-[13px] font-semibold text-text">Kerakli hujjatlar</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {plan.requiredDocuments}
              </p>
            </div>
          </div>
        ) : null}

        {plan.notes ? (
          <p className="mt-3 rounded-xl bg-warning-soft px-4 py-3 text-[13px] leading-relaxed text-warning">
            {plan.notes}
          </p>
        ) : null}

        {/* Grafik */}
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="mb-3 text-[15px] font-semibold text-text">
            Toʻlov grafigi
          </h3>
          <ScheduleTable
            schedule={plan.schedule}
            currency={plan.currency}
            planName={plan.name}
          />
        </div>
      </div>
    </section>
  )
}
