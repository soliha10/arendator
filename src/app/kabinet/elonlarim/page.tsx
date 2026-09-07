import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Heart, Inbox, ListChecks, Plus } from 'lucide-react'
import type { ListingStatus, Prisma } from '@prisma/client'
import { requireArendator } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { LISTING_STATUS_LABELS } from '@/lib/constants'
import { formatCount, formatMoney, formatRelative, formatTerm } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { ListingRowActions } from './listing-row-actions'

export const metadata: Metadata = { title: 'Eʼlonlarim' }

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'Hammasi' },
  { value: 'ACTIVE', label: LISTING_STATUS_LABELS.ACTIVE },
  { value: 'PENDING', label: LISTING_STATUS_LABELS.PENDING },
  { value: 'DRAFT', label: LISTING_STATUS_LABELS.DRAFT },
  { value: 'PAUSED', label: LISTING_STATUS_LABELS.PAUSED },
  { value: 'REJECTED', label: LISTING_STATUS_LABELS.REJECTED },
  { value: 'ARCHIVED', label: LISTING_STATUS_LABELS.ARCHIVED },
]

const STATUS_VARIANT: Record<ListingStatus, 'success' | 'warning' | 'danger' | 'default' | 'primary'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  DRAFT: 'default',
  PAUSED: 'default',
  REJECTED: 'danger',
  ARCHIVED: 'default',
  RENTED: 'primary',
}

export default async function MyListingsPage(props: PageProps<'/kabinet/elonlarim'>) {
  const user = await requireArendator()
  const searchParams = await props.searchParams
  const status = typeof searchParams.status === 'string' ? searchParams.status : 'all'

  const where: Prisma.ListingWhereInput = {
    ownerId: user.id,
    ...(status !== 'all' ? { status: status as ListingStatus } : {}),
  }

  const [listings, counts] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, slug: true, title: true, status: true, year: true,
        viewCount: true, favoriteCount: true, leadCount: true,
        minMonthlyPaymentUzs: true, minTermMonths: true, maxTermMonths: true,
        updatedAt: true, rejectReason: true,
        images: { where: { isCover: true }, take: 1, select: { url: true } },
        _count: { select: { plans: true } },
      },
    }),
    prisma.listing.groupBy({
      by: ['status'],
      where: { ownerId: user.id },
      _count: true,
    }),
  ])

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]))
  const totalCount = counts.reduce((s, c) => s + c._count, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Eʼlonlarim</h1>
          <p className="mt-1.5 text-sm text-muted">
            Jami <span className="tabular font-medium text-text">{totalCount}</span> ta eʼlon
          </p>
        </div>
        <Button asChild>
          <Link href="/kabinet/elon/yangi">
            <Plus /> Eʼlon joylash
          </Link>
        </Button>
      </div>

      {/* Holat filtri */}
      <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === 'all' ? totalCount : (countByStatus[tab.value] ?? 0)
          const active = status === tab.value
          if (tab.value !== 'all' && count === 0 && !active) return null
          return (
            <Link
              key={tab.value}
              href={
                tab.value === 'all'
                  ? '/kabinet/elonlarim'
                  : `/kabinet/elonlarim?status=${tab.value}`
              }
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                active
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border text-muted hover:border-border-strong hover:text-text',
              )}
            >
              {tab.label}
              <span className="tabular text-[12px] opacity-70">{count}</span>
            </Link>
          )
        })}
      </div>

      {listings.length > 0 ? (
        <ul className="space-y-3">
          {listings.map((l) => (
            <li key={l.id} className="card p-3.5">
              <div className="flex gap-4">
                <Link
                  href={`/elon/${l.slug}`}
                  className="relative aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-40"
                >
                  {l.images[0] ? (
                    <Image
                      src={l.images[0].url}
                      alt={l.title}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/elon/${l.slug}`}
                        className="line-clamp-1x font-semibold text-text hover:text-primary"
                      >
                        {l.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_VARIANT[l.status]} size="sm">
                          {LISTING_STATUS_LABELS[l.status]}
                        </Badge>
                        <span className="text-[12px] text-subtle">
                          {formatRelative(l.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <ListingRowActions
                      listingId={l.id}
                      slug={l.slug}
                      title={l.title}
                      status={l.status}
                    />
                  </div>

                  {l.rejectReason ? (
                    <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-[12px] text-danger">
                      {l.rejectReason}
                    </p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2.5 text-[12px] text-muted">
                    {l.minMonthlyPaymentUzs ? (
                      <span className="tabular font-medium text-text">
                        {formatMoney(Number(l.minMonthlyPaymentUzs), 'UZS', { compact: true })}/oy
                      </span>
                    ) : null}
                    {l.minTermMonths && l.maxTermMonths ? (
                      <span>
                        {l.minTermMonths === l.maxTermMonths
                          ? formatTerm(l.minTermMonths)
                          : `${l.minTermMonths}–${l.maxTermMonths} oy`}
                      </span>
                    ) : null}
                    <span>{l._count.plans} ta shart</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" /> {formatCount(l.viewCount)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3.5" /> {l.favoriteCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Inbox className="size-3.5" /> {l.leadCount}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<ListChecks />}
          title={status === 'all' ? 'Hali eʼlon yoʻq' : 'Bu holatda eʼlon yoʻq'}
          description="Avtomobil maʼlumotlari va toʻlov shartlarini kiriting — grafik avtomatik hisoblanadi."
          action={
            <Button asChild>
              <Link href="/kabinet/elon/yangi">
                <Plus /> Birinchi eʼlonni joylash
              </Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
