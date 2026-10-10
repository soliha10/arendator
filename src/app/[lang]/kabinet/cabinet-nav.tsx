'use client'

import { Link, useMessages, usePathnameWithoutLocale } from '@/i18n/client'
import type { Messages } from '@/i18n/messages'
import {
  Bell, Bookmark, CarFront, Inbox, LayoutDashboard, Settings, ShieldCheck,
} from 'lucide-react'
import type { Role } from '@prisma/client'
import { cn } from '@/lib/utils'

export interface CabinetNavCounts {
  listings: number
  leads: number
  /** true — arizalar raqami "yangi" (qizil), false — oddiy */
  leadsAreNew: boolean
  saved: number
  unread: number
}

type Tone = 'danger' | 'primary' | 'muted'

function useItems(role: Role, c: CabinetNavCounts, t: Messages['cabinet']['nav']) {
  const seller = role !== 'USER'
  const items: {
    href: string
    label: string
    icon: typeof Bell
    count?: number
    tone?: Tone
  }[] = [
    { href: '/kabinet', label: t.overview, icon: LayoutDashboard },
    ...(seller
      ? [{ href: '/kabinet/elonlarim', label: t.myListings, icon: CarFront, count: c.listings, tone: 'primary' as Tone }]
      : []),
    {
      href: '/kabinet/arizalar',
      label: seller ? t.incomingLeads : t.myLeads,
      icon: Inbox,
      count: c.leads,
      tone: c.leadsAreNew ? 'danger' : 'muted',
    },
    { href: '/kabinet/saqlanganlar', label: t.saved, icon: Bookmark, count: c.saved, tone: 'muted' },
    { href: '/kabinet/xabarnomalar', label: t.notifications, icon: Bell, count: c.unread, tone: 'primary' },
    { href: '/kabinet/sozlamalar', label: t.settings, icon: Settings },
    ...(role === 'ADMIN' ? [{ href: '/admin', label: t.admin, icon: ShieldCheck }] : []),
  ]
  return items
}

const TONE: Record<Tone, string> = {
  danger: 'bg-danger text-white',
  primary: 'bg-primary text-primary-fg',
  muted: 'bg-surface-3 text-muted',
}

/**
 * Dizayndagi gorizontal tablar. Telefonda yonga suriladi — vertikal
 * ro'yxat mobilda asosiy kontentni pastga surib yuborardi.
 */
export function CabinetNav({ role, counts }: { role: Role; counts: CabinetNavCounts }) {
  const pathname = usePathnameWithoutLocale()
  const t = useMessages().cabinet.nav
  const items = useItems(role, counts, t)
  const isActive = (href: string) =>
    href === '/kabinet' ? pathname === '/kabinet' : pathname.startsWith(href)

  return (
    <nav
      aria-label={t.aria}
      className="hide-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl lg:border lg:border-border lg:bg-surface lg:p-1.5"
    >
      {items.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[14px] font-semibold transition-colors',
              active
                ? 'bg-primary-soft text-primary'
                : 'text-muted hover:bg-surface-2 hover:text-text max-lg:border max-lg:border-border max-lg:bg-surface',
            )}
          >
            <item.icon className="size-[18px]" aria-hidden />
            {item.label}
            {item.count ? (
              <span
                className={cn(
                  'tabular min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold leading-5',
                  TONE[item.tone ?? 'muted'],
                )}
              >
                {item.count > 99 ? '99+' : item.count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
