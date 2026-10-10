'use client'

import { ArrowRight } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { useLocale, useMessages } from '@/i18n/client'
import { CallButton } from './call-button'
import { goToLeadForm, useSelectedPlan } from './selected-plan'

/**
 * Telefon uchun yopishqoq pastki panel.
 *
 * Eʼlon sahifasi uzun: galereya, kalkulyator, grafik — ariza formasiga
 * yetib borish uchun bir necha ekran aylantirish kerak. Panel asosiy
 * raqamni va ikkita maqsadli amalni doim koʻz oldida ushlab turadi.
 * Pastki navigatsiya `/elon/...` sahifalarida yashiriladi.
 */
export function MobileCta({
  listingId,
  plans,
  cashPriceUzs,
}: {
  listingId: string
  plans: { id: string; isDefault: boolean; monthlyPaymentUzs: number; planType: string }[]
  cashPriceUzs: number | null
}) {
  const t = useMessages().listing.mobileCta
  const locale = useLocale()
  const fallback = plans.find((p) => p.isDefault) ?? plans[0] ?? null
  const selectedId = useSelectedPlan(fallback?.id ?? null)
  const plan = plans.find((p) => p.id === selectedId) ?? fallback

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-lg lg:hidden">
      <div className="container-page flex items-center gap-2.5 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
            {plan ? (plan.planType === 'RENT' ? t.rentMonthly : t.monthly) : t.cash}
          </p>
          <p className="font-display tabular truncate text-[18px] font-extrabold leading-tight text-primary">
            {plan
              ? formatMoney(plan.monthlyPaymentUzs, 'UZS', { compact: true, locale })
              : cashPriceUzs !== null
                ? formatMoney(cashPriceUzs, 'UZS', { compact: true, locale })
                : '—'}
          </p>
        </div>

        <CallButton
          listingId={listingId}
          variant="outline"
          label={t.call}
          className="size-12 shrink-0 rounded-[12px] px-0 [&>span]:sr-only [&>svg]:size-5"
        />

        <button
          type="button"
          onClick={() => goToLeadForm(plan?.id ?? null)}
          className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-[12px] bg-primary px-5 text-[15px] font-semibold text-primary-fg transition-colors active:bg-primary-hover"
        >
          {t.apply} <ArrowRight className="size-4.5" aria-hidden />
        </button>
      </div>
    </div>
  )
}
