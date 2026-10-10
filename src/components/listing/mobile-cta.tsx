'use client'

import { MessageSquareText, Phone } from 'lucide-react'
import { formatMoney } from '@/lib/format'

/**
 * Telefon uchun yopishqoq pastki panel.
 *
 * Eʼlon sahifasi uzun: galereya, xususiyatlar, toʻlov grafigi — ariza
 * formasiga yetib borish uchun bir necha ekran aylantirish kerak.
 * Bu panel asosiy raqamni va ikkita maqsadli amalni doim koʻz oldida
 * ushlab turadi. Pastki navigatsiya `/elon/...` sahifalarida yashiriladi,
 * shuning uchun ikkita panel ustma-ust tushmaydi.
 */
export function MobileCta({
  monthlyUzs,
  contactPhone,
}: {
  monthlyUzs: number | null
  contactPhone: string
}) {
  const scrollToForm = () => {
    const el = document.getElementById('ariza')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el.querySelector<HTMLInputElement>('input[name="fullName"]')?.focus({
      preventScroll: true,
    })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-lg lg:hidden">
      <div className="container-page flex items-center gap-2.5 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
            Oyiga
          </p>
          <p className="tabular truncate text-[17px] font-bold leading-tight text-text">
            {monthlyUzs !== null
              ? formatMoney(monthlyUzs, 'UZS', { compact: true })
              : '—'}
          </p>
        </div>

        <a
          href={`tel:${contactPhone}`}
          aria-label="Arendatorga qoʻngʻiroq qilish"
          className="flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-border-strong bg-surface text-text transition-colors active:bg-surface-2"
        >
          <Phone className="size-5" aria-hidden />
        </a>

        <button
          type="button"
          onClick={scrollToForm}
          className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[12px] bg-primary px-5 text-[15px] font-semibold text-primary-fg transition-colors active:bg-primary-hover"
        >
          <MessageSquareText className="size-[18px]" aria-hidden />
          Ariza
        </button>
      </div>
    </div>
  )
}
