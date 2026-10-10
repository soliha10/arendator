import type { Metadata } from 'next'
import { Bell } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { NOTIFICATION_GROUPS } from '@/server/cabinet'
import { readPrefs } from '@/server/notifications'
import { EmptyState } from '@/components/ui/empty'
import { NotificationCard, type NotificationView } from '@/components/cabinet/notification-card'
import { MarkAllReadButton, NotificationSettings } from '@/components/cabinet/notification-settings'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/client'
import { getLocale, getMessages } from '@/i18n/server'
import { fmt, plural } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'
import { renderNotification } from '@/i18n/notifications'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).cabinet.meta.notifications }
}

const PAGE_SIZE = 50

export default async function NotificationsPage(props: PageProps<'/[lang]/kabinet/xabarnomalar'>) {
  const user = await requireUser('/kabinet/xabarnomalar')
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  const t = m.cabinet.notifications
  const sp = await props.searchParams
  const group = NOTIFICATION_GROUPS.find((g) => g.value === sp.tur) ?? NOTIFICATION_GROUPS[0]

  const where: Prisma.NotificationWhereInput = {
    userId: user.id,
    ...(group.types ? { type: { in: [...group.types] } } : {}),
  }

  const [rows, byType, unread, me] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      select: {
        id: true, type: true, title: true, body: true, link: true,
        readAt: true, createdAt: true, data: true,
        listing: {
          select: {
            title: true, slug: true,
            region: { select: { name: true, slug: true } },
            images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }], take: 1, select: { url: true } },
          },
        },
      },
    }),
    prisma.notification.groupBy({ by: ['type'], where: { userId: user.id }, _count: true }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { notificationPrefs: true } }),
  ])

  const countOf = (types: readonly string[] | null) =>
    byType.filter((r) => !types || types.includes(r.type)).reduce((s, r) => s + r._count, 0)

  const items: NotificationView[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    // Matn o'quvchi tilida shablondan yasaladi (eski yozuvlarda — bazadagi)
    ...renderNotification(n, m, locale),
    link: n.link,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
    data: n.data && typeof n.data === 'object' && !Array.isArray(n.data) ? (n.data as Record<string, unknown>) : null,
    listing: n.listing
      ? {
          title: n.listing.title,
          slug: n.listing.slug,
          imageUrl: n.listing.images[0]?.url ?? null,
          region: regionLabel(m, n.listing.region.slug, n.listing.region.name),
        }
      : null,
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display flex flex-wrap items-center gap-3 text-2xl font-extrabold text-text sm:text-[30px]">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-fg">
              <Bell className="size-5" aria-hidden />
            </span>
            {t.title}
            {unread > 0 ? (
              <span className="tabular rounded-full bg-primary-soft px-2.5 py-0.5 font-sans text-[12px] font-semibold text-primary">
                {plural(locale, unread, t.unread)}
              </span>
            ) : null}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t.subtitle}
          </p>
        </div>
        <MarkAllReadButton disabled={unread === 0} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-3">
          <div className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {NOTIFICATION_GROUPS.map((g) => {
              const active = g.value === group.value
              return (
                <Link
                  key={g.value}
                  href={g.value === 'all' ? '/kabinet/xabarnomalar' : `/kabinet/xabarnomalar?tur=${g.value}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-4 text-[14px] font-semibold transition-colors',
                    active ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-text hover:bg-surface-3',
                  )}
                >
                  {t.groups[g.value]}
                  <span className="tabular text-[12px] opacity-75">({countOf(g.types)})</span>
                </Link>
              )
            })}
          </div>

          {items.length > 0 ? (
            items.map((n) => <NotificationCard key={n.id} n={n} />)
          ) : (
            <EmptyState
              icon={<Bell />}
              title={t.empty}
              description={t.emptyHint}
            />
          )}
          {rows.length === PAGE_SIZE ? (
            <p className="text-center text-[12px] text-subtle">{fmt(t.limit, { n: PAGE_SIZE })}</p>
          ) : null}
        </div>

        <aside>
          <NotificationSettings initial={readPrefs(me.notificationPrefs)} seller={user.role !== 'USER'} />
        </aside>
      </div>
    </div>
  )
}
