import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Eye, Heart, Inbox, ListChecks, Plus, TrendingUp,
} from 'lucide-react'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { LEAD_STATUS_LABELS, LISTING_STATUS_LABELS } from '@/lib/constants'
import { formatCount, formatMoney, formatRelative } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty'

export const metadata: Metadata = { title: 'Kabinet' }

export default async function CabinetPage() {
  const user = await requireUser('/kabinet')
  const isArendator = user.role !== 'USER'

  if (!isArendator) {
    const [favorites, leads] = await Promise.all([
      prisma.favorite.count({ where: { userId: user.id } }),
      prisma.lead.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, status: true, createdAt: true,
          listing: { select: { title: true, slug: true } },
        },
      }),
    ])

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
            Salom, {user.fullName.split(' ')[0]}!
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Saqlangan eʼlonlar va yuborgan arizalaringiz shu yerda
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <Link href="/kabinet/saqlanganlar" className="card p-3.5 transition-colors hover:border-primary sm:p-5">
            <Heart className="size-5 text-primary" />
            <p className="tabular mt-2.5 text-xl font-bold text-text sm:mt-3 sm:text-2xl">{favorites}</p>
            <p className="mt-0.5 text-[13px] text-muted sm:text-sm">Saqlangan eʼlon</p>
          </Link>
          <Link href="/kabinet/arizalar" className="card p-3.5 transition-colors hover:border-primary sm:p-5">
            <Inbox className="size-5 text-primary" />
            <p className="tabular mt-2.5 text-xl font-bold text-text sm:mt-3 sm:text-2xl">{leads.length}</p>
            <p className="mt-0.5 text-[13px] text-muted sm:text-sm">Yuborilgan ariza</p>
          </Link>
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-semibold text-text">Soʻnggi arizalar</h2>
          {leads.length > 0 ? (
            <ul className="divide-y divide-border">
              {leads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/elon/${lead.listing.slug}`}
                      className="line-clamp-1x text-sm font-medium text-text hover:text-primary"
                    >
                      {lead.listing.title}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-subtle">
                      {formatRelative(lead.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      lead.status === 'APPROVED'
                        ? 'success'
                        : lead.status === 'REJECTED'
                          ? 'danger'
                          : lead.status === 'CONTACTED'
                            ? 'primary'
                            : 'default'
                    }
                    size="sm"
                  >
                    {LEAD_STATUS_LABELS[lead.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Inbox />}
              title="Hali ariza yuborilmagan"
              description="Yoqqan avtomobilni topib, arendatorga ariza qoldiring."
              action={
                <Button asChild>
                  <Link href="/elonlar">Eʼlonlarni koʻrish</Link>
                </Button>
              }
            />
          )}
        </div>
      </div>
    )
  }

  // ── Arendator paneli ──
  const [counts, aggregate, recentLeads, recentListings] = await Promise.all([
    prisma.listing.groupBy({
      by: ['status'],
      where: { ownerId: user.id },
      _count: true,
    }),
    prisma.listing.aggregate({
      where: { ownerId: user.id },
      _sum: { viewCount: true, favoriteCount: true, leadCount: true },
    }),
    prisma.lead.findMany({
      where: { listing: { ownerId: user.id } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true, fullName: true, phone: true, status: true, createdAt: true,
        listing: { select: { title: true, slug: true } },
        plan: { select: { name: true, monthlyPayment: true, currency: true } },
      },
    }),
    prisma.listing.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true, slug: true, title: true, status: true,
        viewCount: true, leadCount: true, minMonthlyPaymentUzs: true,
      },
    }),
  ])

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]))
  const newLeads = recentLeads.filter((l) => l.status === 'NEW').length

  const stats = [
    { label: 'Faol eʼlonlar', value: byStatus.ACTIVE ?? 0, icon: ListChecks, href: '/kabinet/elonlarim?status=ACTIVE' },
    { label: 'Koʻrishlar', value: formatCount(aggregate._sum.viewCount ?? 0), icon: Eye },
    { label: 'Saqlanganlar', value: aggregate._sum.favoriteCount ?? 0, icon: Heart },
    { label: 'Arizalar', value: aggregate._sum.leadCount ?? 0, icon: Inbox, href: '/kabinet/arizalar' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
            Salom, {user.fullName.split(' ')[0]}!
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {newLeads > 0
              ? `${newLeads} ta yangi ariza javob kutyapti`
              : 'Eʼlonlaringiz holati va statistikasi'}
          </p>
        </div>
        {/* Telefonda bu amal kabinet sarlavhasi qatorida bor — takrorlanmaydi */}
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/kabinet/elon/yangi">
            <Plus /> Eʼlon joylash
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const content = (
            <>
              <s.icon className="size-5 text-primary" />
              <p className="tabular mt-2.5 text-xl font-bold text-text sm:mt-3 sm:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-[13px] text-muted sm:text-sm">{s.label}</p>
            </>
          )
          return s.href ? (
            <Link key={s.label} href={s.href} className="card p-3.5 transition-colors hover:border-primary sm:p-5">
              {content}
            </Link>
          ) : (
            <div key={s.label} className="card p-3.5 sm:p-5">
              {content}
            </div>
          )
        })}
      </div>

      {(byStatus.PENDING ?? 0) > 0 || (byStatus.REJECTED ?? 0) > 0 || (byStatus.DRAFT ?? 0) > 0 ? (
        <div className="card p-5">
          <h2 className="mb-3 text-base font-semibold text-text">Eʼtibor talab qiladi</h2>
          <div className="flex flex-wrap gap-2">
            {(['DRAFT', 'PENDING', 'REJECTED', 'PAUSED'] as const)
              .filter((s) => (byStatus[s] ?? 0) > 0)
              .map((s) => (
                <Link
                  key={s}
                  href={`/kabinet/elonlarim?status=${s}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-[13px] transition-colors hover:border-primary"
                >
                  {LISTING_STATUS_LABELS[s]}
                  <span className="tabular font-semibold text-text">{byStatus[s]}</span>
                </Link>
              ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Soʻnggi arizalar</h2>
            <Link href="/kabinet/arizalar" className="text-[13px] font-medium text-primary hover:underline">
              Barchasi
            </Link>
          </div>
          {recentLeads.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">{lead.fullName}</p>
                      <p className="tabular text-[12px] text-muted">{lead.phone}</p>
                      <Link
                        href={`/elon/${lead.listing.slug}`}
                        className="line-clamp-1x mt-1 text-[12px] text-subtle hover:text-primary"
                      >
                        {lead.listing.title}
                        {lead.plan ? ` · ${lead.plan.name}` : ''}
                      </Link>
                    </div>
                    <Badge
                      variant={lead.status === 'NEW' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">Hali ariza yoʻq</p>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Eʼlonlarim</h2>
            <Link href="/kabinet/elonlarim" className="text-[13px] font-medium text-primary hover:underline">
              Barchasi
            </Link>
          </div>
          {recentListings.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentListings.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/elon/${l.slug}`}
                      className="line-clamp-1x text-sm font-medium text-text hover:text-primary"
                    >
                      {l.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-3 text-[12px] text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3" /> {formatCount(l.viewCount)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="size-3" /> {l.leadCount} ariza
                      </span>
                      {l.minMonthlyPaymentUzs ? (
                        <span className="tabular">
                          {formatMoney(Number(l.minMonthlyPaymentUzs), 'UZS', { compact: true })}/oy
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <Badge
                    variant={
                      l.status === 'ACTIVE'
                        ? 'success'
                        : l.status === 'REJECTED'
                          ? 'danger'
                          : l.status === 'PENDING'
                            ? 'warning'
                            : 'default'
                    }
                    size="sm"
                  >
                    {LISTING_STATUS_LABELS[l.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<ListChecks />}
              title="Hali eʼlon yoʻq"
              description="Birinchi avtomobilingizni joylashtiring."
              action={
                <Button asChild>
                  <Link href="/kabinet/elon/yangi">
                    <Plus /> Eʼlon joylash
                  </Link>
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
