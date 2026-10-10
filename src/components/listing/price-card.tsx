import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Eʼlonning asosiy raqamlari.
 * Telefonda galereyadan soʻng darhol koʻrsatiladi, kengroq ekranda esa
 * oʻng ustundagi yopishqoq panelda turadi — shuning uchun alohida
 * komponent qilib ajratilgan.
 */
export function PriceCard({
  monthlyUzs,
  downUzs,
  carPriceUzs,
  minTermMonths,
  maxTermMonths,
  planCount,
  className,
}: {
  monthlyUzs: number | null
  downUzs: number | null
  carPriceUzs: number | null
  minTermMonths: number | null
  maxTermMonths: number | null
  planCount: number
  className?: string
}) {
  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="bg-primary-soft px-4 py-4 sm:px-5">
        <p className="text-[12px] font-medium uppercase tracking-wide text-primary/80">
          Oyiga
        </p>
        <p className="tabular mt-1 text-[28px] font-bold leading-none text-primary sm:text-3xl">
          {monthlyUzs !== null ? formatMoney(monthlyUzs, 'UZS') : '—'}
        </p>
        <p className="mt-2 text-[13px] text-primary/80">
          {minTermMonths && maxTermMonths
            ? `${minTermMonths}–${maxTermMonths} oy muddatga`
            : 'Shartlar quyida'}
        </p>
      </div>
      <dl className="divide-y divide-border px-4 sm:px-5">
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-[13px] text-muted">Boshlangʻich toʻlov</dt>
          <dd className="tabular text-[14px] font-semibold text-text">
            {downUzs !== null ? formatMoney(downUzs, 'UZS') : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-[13px] text-muted">Avtomobil narxi</dt>
          <dd className="tabular text-[14px] font-semibold text-text">
            {carPriceUzs !== null ? formatMoney(carPriceUzs, 'UZS') : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-3">
          <dt className="text-[13px] text-muted">Shartlar soni</dt>
          <dd className="text-[14px] font-semibold text-text">
            <a href="#shartlar" className="text-primary hover:underline">
              {planCount} ta variant
            </a>
          </dd>
        </div>
      </dl>
    </div>
  )
}
