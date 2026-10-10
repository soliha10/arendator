import type { Metadata } from 'next'
import Image from 'next/image'
import {
  AlertTriangle, ArrowRight, Bell, CarFront, Eye, Heart,
  ImagePlus, Inbox, PhoneCall, PlusCircle, Search,
} from 'lucide-react'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { getCabinetCounts } from '@/server/cabinet'
import { formatCount, formatMoney, formatRelative } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty'
import { StatCard } from '@/components/cabinet/stat-card'
import { LEAD_MINI_SELECT, LEAD_STATUS_TONE, LeadMiniCard } from '@/components/cabinet/lead-mini-card'
import { PROFILE_HEADER_SELECT, ProfileHeader } from '@/components/cabinet/profile-header'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt, plural } from '@/i18n/format'
import { renderNotification } from '@/i18n/notifications'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).cabinet.meta.overview }
}

/** Kam rasmli yoki tavsifsiz e'lon kamroq qo'ng'iroq oladi — egasiga eslatamiz */
const MIN_GOOD_PHOTOS = 5

export default async function CabinetPage() {
  const user = await requireUser('/kabinet')
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.cabinet.overview
  const [me, counts] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: PROFILE_HEADER_SELECT }),
    getCabinetCounts(user.id),
  ])

  if (user.role === 'USER') return <BuyerDashboard userId={user.id} me={me} counts={counts} />

  const [byStatusRows, sums, recentLeads, topListings, weakListings] = await Promise.all([
    prisma.listing.groupBy({ by: ['status'], where: { ownerId: user.id }, _count: true }),
    prisma.listing.aggregate({
      where: { ownerId: user.id },
      _sum: { viewCount: true, favoriteCount: true, leadCount: true, phoneRevealCount: true },
    }),
    prisma.lead.findMany({
      where: { listing: { ownerId: user.id } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 3,
      select: LEAD_MINI_SELECT,
    }),
    prisma.listing.findMany({
      where: { ownerId: user.id, status: 'ACTIVE' },
      orderBy: { viewCount: 'desc' },
      take: 4,
      select: {
        id: true, slug: true, title: true, viewCount: true, leadCount: true,
        phoneRevealCount: true, favoriteCount: true,
        images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }], take: 1, select: { url: true } },
      },
    }),
    prisma.listing.findMany({
      where: { ownerId: user.id, status: { in: ['ACTIVE', 'PENDING', 'DRAFT'] } },
      select: {
        id: true, title: true, description: true,
        _count: { select: { images: true } },
      },
    }),
  ])

  const byStatus = Object.fromEntries(byStatusRows.map((r) => [r.status, r._count])) as Record<string, number>
  const total = byStatusRows.reduce((s, r) => s + r._count, 0)
  const weak = weakListings
    .filter((l) => l._count.images < MIN_GOOD_PHOTOS || !l.description || l.description.length < 80)
    .slice(0, 3)
  const attention = (['DRAFT', 'PENDING', 'REJECTED', 'PAUSED'] as const).filter((s) => (byStatus[s] ?? 0) > 0)

  return (
    <div className="space-y-5 sm:space-y-6">
      <ProfileHeader user={me} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          label={t.activeListings}
          value={byStatus.ACTIVE ?? 0}
          suffix={fmt(t.totalSuffix, { n: total })}
          hint={(byStatus.PENDING ?? 0) > 0 ? plural(locale, byStatus.PENDING, t.pendingHint) : undefined}
          hintTone="primary"
          icon={CarFront}
          href="/kabinet/elonlarim"
        />
        <StatCard
          label={t.incomingLeads}
          value={sums._sum.leadCount ?? 0}
          badge={counts.newLeads > 0 ? fmt(t.newBadge, { n: counts.newLeads }) : undefined}
          hint={counts.newLeads > 0 ? t.awaitingReply : t.allReviewed}
          hintTone={counts.newLeads > 0 ? 'primary' : 'muted'}
          icon={Inbox}
          href="/kabinet/arizalar"
        />
        <StatCard
          label={t.views}
          value={formatCount(sums._sum.viewCount ?? 0, locale)}
          icon={Eye}
        />
        <StatCard
          label={t.phoneReveals}
          value={formatCount(sums._sum.phoneRevealCount ?? 0, locale)}
          hint={t.phoneRevealsHint}
          hintTone="muted"
          icon={PhoneCall}
        />
        <StatCard
          label={t.favorites}
          value={formatCount(sums._sum.favoriteCount ?? 0, locale)}
          hint={t.favoritesHint}
          hintTone="muted"
          icon={Heart}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {attention.length > 0 || weak.length > 0 ? (
            <section className="rounded-xl border border-warning/30 bg-warning-soft/50 p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-text">
                <AlertTriangle className="size-[18px] text-warning" aria-hidden /> {t.attention}
              </h2>
              {attention.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attention.map((s) => (
                    <Link
                      key={s}
                      href={`/kabinet/elonlarim?status=${s}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] text-text transition-colors hover:border-primary"
                    >
                      {m.enums.listingStatus[s]}
                      <span className="tabular font-bold">{byStatus[s]}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {weak.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {weak.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2.5">
                      <span className="min-w-0 text-[13px] text-muted">
                        <span className="font-semibold text-text">{l.title}</span>
                        {' — '}
                        {l._count.images < MIN_GOOD_PHOTOS
                          ? plural(locale, l._count.images, t.fewPhotos)
                          : t.shortDescription}
                      </span>
                      <Link
                        href={`/kabinet/elon/${l.id}/tahrirlash`}
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
                      >
                        <ImagePlus className="size-4" aria-hidden /> {t.improve}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-text">{t.topListings}</h2>
              <Link href="/kabinet/elonlarim" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                {m.cabinet.common.all} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            {topListings.length > 0 ? (
              <ul className="divide-y divide-border">
                {topListings.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Link href={`/elon/${l.slug}`} className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {l.images[0] ? (
                        <Image src={l.images[0].url} alt={l.title} fill sizes="80px" className="object-cover" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/elon/${l.slug}`} className="line-clamp-1x text-[14px] font-semibold text-text hover:text-primary">
                        {l.title}
                      </Link>
                      <p className="tabular mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
                        <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {formatCount(l.viewCount, locale)}</span>
                        <span className="inline-flex items-center gap-1"><PhoneCall className="size-3.5" /> {l.phoneRevealCount}</span>
                        <span className="inline-flex items-center gap-1"><Inbox className="size-3.5" /> {l.leadCount}</span>
                        <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {l.favoriteCount}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<CarFront />}
                title={t.noActive}
                description={t.noActiveHint}
                action={
                  <Button asChild>
                    <Link href="/kabinet/elon/yangi"><PlusCircle /> {m.cabinet.common.postAd}</Link>
                  </Button>
                }
              />
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-text">{t.leadsTitle}</h2>
              {counts.newLeads > 0 ? (
                <span className="rounded-md bg-danger px-2 py-0.5 text-[11px] font-bold text-white">
                  {plural(locale, counts.newLeads, t.newCount)}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              {t.leadsHint}
            </p>
          </div>
          {recentLeads.length > 0 ? (
            recentLeads.map((lead) => <LeadMiniCard key={lead.id} lead={lead} />)
          ) : (
            <p className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted">
              {m.cabinet.common.noLeadsYet}
            </p>
          )}
          {recentLeads.length > 0 ? (
            <Link
              href="/kabinet/arizalar"
              className="flex h-10 items-center justify-center gap-1 rounded-lg border border-border bg-surface text-[13px] font-semibold text-primary hover:bg-surface-2"
            >
              {m.cabinet.common.allLeads} <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

async function BuyerDashboard({
  userId,
  me,
  counts,
}: {
  userId: string
  me: Parameters<typeof ProfileHeader>[0]['user']
  counts: Awaited<ReturnType<typeof getCabinetCounts>>
}) {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.cabinet.buyer
  const c = m.cabinet.common
  const [leads, notifications] = await Promise.all([
    prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, status: true, createdAt: true,
        listing: { select: { title: true, slug: true } },
        plan: { select: { monthlyPayment: true, currency: true, termMonths: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, title: true, body: true, data: true, createdAt: true, readAt: true, link: true },
    }),
  ])

  return (
    <div className="space-y-5 sm:space-y-6">
      <ProfileHeader user={me} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={t.savedListings} value={counts.favorites} icon={Heart} href="/kabinet/saqlanganlar" />
        <StatCard label={t.myLeads} value={counts.myLeads} icon={Inbox} href="/kabinet/arizalar" />
        <StatCard
          label={t.savedSearches}
          value={counts.savedSearches}
          hint={t.savedSearchesHint}
          hintTone="muted"
          icon={Search}
          href="/kabinet/saqlanganlar?tab=qidiruvlar"
        />
        <StatCard
          label={t.newNotifications}
          value={counts.unread}
          icon={Bell}
          href="/kabinet/xabarnomalar"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-text">{t.recentLeads}</h2>
            <Link href="/kabinet/arizalar" className="text-[13px] font-semibold text-primary hover:underline">
              {c.all}
            </Link>
          </div>
          {leads.length > 0 ? (
            <ul className="divide-y divide-border">
              {leads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link href={`/elon/${lead.listing.slug}`} className="line-clamp-1x text-[14px] font-semibold text-text hover:text-primary">
                      {lead.listing.title}
                    </Link>
                    <p className="tabular mt-0.5 text-[12px] text-subtle">
                      {lead.plan
                        ? `${fmt(c.perMonth, { amount: formatMoney(Number(lead.plan.monthlyPayment), lead.plan.currency, { compact: true, locale }) })} · ${fmt(c.months, { n: lead.plan.termMonths })} · `
                        : ''}
                      {formatRelative(lead.createdAt, locale)}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold', LEAD_STATUS_TONE[lead.status])}>
                    {m.enums.leadStatus[lead.status]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Inbox />}
              title={t.noLeads}
              description={t.noLeadsHint}
              action={
                <Button asChild>
                  <Link href="/elonlar">{c.browseCars}</Link>
                </Button>
              }
            />
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-text">{t.notifications}</h2>
              <Link href="/kabinet/xabarnomalar" className="text-[13px] font-semibold text-primary hover:underline">
                {c.all}
              </Link>
            </div>
            {notifications.length > 0 ? (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      href="/kabinet/xabarnomalar"
                      className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                    >
                      <span
                        className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.readAt ? 'bg-transparent' : 'bg-primary')}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-2x text-[13px] font-medium text-text">
                          {renderNotification(n, m, locale).title}
                        </span>
                        <span className="text-[11px] text-subtle">{formatRelative(n.createdAt, locale)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-[13px] text-muted">{t.noNotifications}</p>
            )}
          </section>

          <section className="rounded-xl bg-primary p-5 text-primary-fg">
            <CarFront className="size-6" aria-hidden />
            <h2 className="mt-3 text-lg font-bold">{t.sellTitle}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed opacity-90">
              {t.sellText}
            </p>
            <Link
              href="/kabinet/elon/yangi"
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-surface text-[14px] font-semibold text-primary hover:brightness-95"
            >
              <PlusCircle className="size-4" aria-hidden /> {c.postAd}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
