'use client'

import Image from 'next/image'
import { Camera, CheckCircle2, KeyRound } from 'lucide-react'
import type { Currency } from '@prisma/client'
import { formatMileage, formatMoney } from '@/lib/format'
import type { ListingFormState } from './types'
import { useLocale, useMessages } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { computeDraft, num } from './finance-section'

/** O'ng ustundagi jonli prevyu — xaridor katalogda nimani ko'rishini ko'rsatadi */
export function ListingPreview({
  form,
  brandName,
  modelName,
  regionName,
}: {
  form: ListingFormState
  brandName?: string
  modelName?: string
  regionName?: string
}) {
  const locale = useLocale()
  const t = useMessages().form.preview
  const carPrice = num(form.carPrice)
  const currency: Currency = form.currency
  const money = (n: number) => formatMoney(n, currency, { locale })
  const cover = form.images[0]
  const inst = form.plans.find((p) => p.planType !== 'RENT')
  const rent = form.plans.find((p) => p.planType === 'RENT')
  const calc = inst ? computeDraft(inst, carPrice, currency) : null
  const downPct = inst && carPrice > 0 ? Math.round((num(inst.downPayment) / carPrice) * 100) : 0

  const badge = [inst ? (inst.planType === 'LEASING' ? t.leasing : t.installment) : null, rent ? t.rent : null]
    .filter(Boolean)
    .join(' / ')

  const title = form.title.trim() || [brandName, modelName].filter(Boolean).join(' ') || t.carName
  const subtitle = [form.engineVolume ? `${form.engineVolume} L` : null, regionName].filter(Boolean).join(' • ')

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{t.title}</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-success">
          <span className="size-1.5 rounded-full bg-success" /> {t.live}
        </span>
      </div>

      <div className="relative aspect-[16/10] bg-surface-2">
        {cover ? (
          <Image src={cover.url} alt="" fill sizes="360px" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-subtle">
            <Camera className="size-8" />
            <span className="text-[12px]">{t.noPhoto}</span>
          </div>
        )}
        <span className="tabular absolute left-3 top-3 rounded-md bg-surface/90 px-2 py-0.5 text-[11px] font-semibold text-text">
          {form.year} · {formatMileage(num(form.mileage), locale)}
        </span>
        {badge ? (
          <span className="absolute right-3 top-3 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-fg">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="font-display line-clamp-2x text-[17px] font-bold text-text">{title}</p>
        {subtitle ? <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p> : null}

        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2.5">
          <span className="text-[12px] font-medium text-muted">
            {form.hasCashSale ? t.cashPrice : t.carPrice}
          </span>
          <span className="font-display tabular text-[16px] font-extrabold text-text">
            {carPrice > 0 ? money(carPrice) : '—'}
          </span>
        </div>

        {inst ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-primary-soft/70 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {fmt(t.down, { pct: downPct })}
              </p>
              <p className="tabular mt-0.5 text-[13px] font-bold text-primary">
                {carPrice > 0 ? formatMoney(num(inst.downPayment), currency, { compact: true, locale }) : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-primary-soft/70 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t.monthly}</p>
              <p className="tabular mt-0.5 text-[13px] font-bold text-primary">
                {calc ? `~ ${formatMoney(calc.monthlyPayment, currency, { compact: true, locale })}` : '—'}
              </p>
            </div>
          </div>
        ) : null}

        {rent && (num(rent.dailyPayment) > 0 || num(rent.monthlyPaymentInput) > 0) ? (
          <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-muted">
            {rent.ownershipTransfer ? (
              <CheckCircle2 className="size-3.5 text-success" />
            ) : (
              <KeyRound className="size-3.5 text-primary" />
            )}
            {rent.ownershipTransfer ? t.rentToOwn : t.rent}:{' '}
            <span className="tabular font-semibold text-text">
              {num(rent.dailyPayment) > 0
                ? fmt(t.perDay, { amount: money(num(rent.dailyPayment)) })
                : fmt(t.perMonth, { amount: money(num(rent.monthlyPaymentInput)) })}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
