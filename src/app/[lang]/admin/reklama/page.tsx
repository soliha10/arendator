import type { Metadata } from 'next'
import Image from 'next/image'
import { Crown, Phone } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PROMOTION_PLANS } from '@/lib/constants'
import { formatMoney, formatPhone, formatRelative } from '@/lib/format'
import { EmptyState } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { ResolveButtons } from './resolve-buttons'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt } from '@/i18n/format'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).admin.meta.promotions }
}

const STATUS_TONE = {
  PENDING: 'bg-warning-soft text-warning',
  APPROVED: 'bg-success-soft text-success',
  REJECTED: 'bg-danger-soft text-danger',
} as const

export default async function PromotionRequestsPage() {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.admin.promotions
  const requests = await prisma.promotionRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    select: {
      id: true, tier: true, days: true, status: true, createdAt: true, resolvedAt: true,
      user: { select: { fullName: true, phone: true } },
      listing: {
        select: {
          title: true, slug: true, status: true, promotion: true, promotedUntil: true,
          images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }], take: 1, select: { url: true } },
        },
      },
    },
  })

  const pending = requests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4 text-[13px] leading-relaxed text-muted">
        {fmt(t.info, { approve: `“${m.admin.common.approve}”` })}
        <span className="tabular ml-1 font-semibold text-text">{fmt(t.pendingCount, { n: pending })}</span>
      </div>

      {requests.length > 0 ? (
        <ul className="space-y-3">
          {requests.map((r) => {
            const plan = PROMOTION_PLANS.find((p) => p.tier === r.tier)
            return (
              <li key={r.id} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
                <Link
                  href={`/elon/${r.listing.slug}`}
                  className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-36"
                >
                  {r.listing.images[0] ? (
                    <Image src={r.listing.images[0].url} alt={r.listing.title} fill sizes="144px" className="object-cover" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[12px] font-bold text-primary-fg">
                      <Crown className="size-3.5" aria-hidden /> {fmt(t.days, { tier: r.tier, n: r.days })}
                    </span>
                    <span className={cn('rounded-md px-2 py-0.5 text-[12px] font-semibold', STATUS_TONE[r.status])}>
                      {t.status[r.status]}
                    </span>
                    {plan ? (
                      <span className="tabular text-[13px] font-semibold text-text">{formatMoney(plan.priceUzs, 'UZS', { locale })}</span>
                    ) : null}
                  </div>
                  <Link href={`/elon/${r.listing.slug}`} className="line-clamp-1x mt-1.5 text-[15px] font-bold text-text hover:text-primary">
                    {r.listing.title}
                  </Link>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
                    <span>{r.user.fullName}</span>
                    <a href={`tel:${r.user.phone}`} className="tabular inline-flex items-center gap-1 text-primary hover:underline">
                      <Phone className="size-3" aria-hidden /> {formatPhone(r.user.phone)}
                    </a>
                    <span>{formatRelative(r.createdAt, locale)}</span>
                    {r.listing.status !== 'ACTIVE' ? <span className="text-warning">{t.inactive}</span> : null}
                  </p>
                </div>
                {r.status === 'PENDING' ? <ResolveButtons requestId={r.id} /> : (
                  <span className="text-[12px] text-subtle">{r.resolvedAt ? formatRelative(r.resolvedAt, locale) : ''}</span>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState icon={<Crown />} title={t.empty} description={t.emptyHint} />
      )}
    </div>
  )
}
