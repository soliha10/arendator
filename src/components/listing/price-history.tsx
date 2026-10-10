import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatDate, formatMoney } from '@/lib/format'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt, plural } from '@/i18n/format'
import { cn } from '@/lib/utils'

/**
 * Narx tarixi (AutoTrader / CarGurus uslubida): xaridor narx qanday
 * o'zgarganini ko'radi va savdolashishda shunga tayanadi.
 * Kutubxonasiz SVG — server komponent, JS yuklanmaydi.
 */
export async function PriceHistory({
  points,
  className,
}: {
  points: { priceUzs: number; createdAt: string }[]
  className?: string
}) {
  if (points.length < 2) return null
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.listing.priceHistory

  const W = 600
  const H = 120
  const PAD = 10
  const prices = points.map((p) => p.priceUzs)
  // Shkala noldan emas, lekin 4% lik tushish ham "qulash" bo'lib ko'rinmasin:
  // diapazon kamida narxning 20% i qilib olinadi
  const rawMin = Math.min(...prices)
  const rawMax = Math.max(...prices)
  const pad = Math.max((rawMax - rawMin) * 0.5, rawMax * 0.1)
  const min = rawMin - pad
  const span = rawMax + pad - min || 1
  // X o'qi — vaqt bo'yicha (o'zgarishlar orasidagi kunlar ko'rinadi)
  const t0 = new Date(points[0].createdAt).getTime()
  const t1 = Math.max(new Date(points[points.length - 1].createdAt).getTime(), t0 + 1)
  const xy = points.map((p) => ({
    x: PAD + ((new Date(p.createdAt).getTime() - t0) / (t1 - t0)) * (W - PAD * 2),
    y: PAD + (1 - (p.priceUzs - min) / span) * (H - PAD * 2),
  }))
  // Zinapoya: narx keyingi o'zgarishgacha bir xil turadi
  const path = xy
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `H${p.x} V${p.y}`))
    .join(' ')

  const first = points[0].priceUzs
  const last = points[points.length - 1].priceUzs
  const diff = last - first
  const down = diff < 0

  return (
    <section className={cn('card p-5 sm:p-6', className)} aria-labelledby="ph-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ph-title" className="text-[18px] font-bold text-text">{t.title}</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            {fmt(plural(locale, points.length - 1, t.since), { date: formatDate(points[0].createdAt) })}
          </p>
        </div>
        {diff !== 0 ? (
          <span
            className={cn(
              'tabular inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold',
              down ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
            )}
          >
            {down ? <TrendingDown className="size-4" aria-hidden /> : <TrendingUp className="size-4" aria-hidden />}
            {down ? '−' : '+'}
            {formatMoney(Math.abs(diff), 'UZS', { compact: true, locale })}
          </span>
        ) : null}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-28 w-full" preserveAspectRatio="none" role="img" aria-label={t.chartAria}>
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        {xy.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--surface)" stroke="var(--primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      <ol className="mt-3 divide-y divide-border text-[13px]">
        {[...points].reverse().slice(0, 4).map((p, i, arr) => {
          const prev = arr[i + 1]
          return (
            <li key={p.createdAt} className="flex items-center justify-between gap-3 py-2">
              <span className="text-muted">{formatDate(p.createdAt)}</span>
              <span className="tabular font-semibold text-text">
                {formatMoney(p.priceUzs, 'UZS', { locale })}
                {prev && prev.priceUzs !== p.priceUzs ? (
                  <span className={cn('ml-2 text-[12px]', p.priceUzs < prev.priceUzs ? 'text-success' : 'text-warning')}>
                    {p.priceUzs < prev.priceUzs ? '▼' : '▲'}
                  </span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
