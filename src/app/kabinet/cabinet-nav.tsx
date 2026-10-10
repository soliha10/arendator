'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Heart, Inbox, LayoutDashboard, ListChecks, Plus, Settings, ShieldCheck,
} from 'lucide-react'
import type { Role } from '@prisma/client'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/kabinet', label: 'Umumiy', icon: LayoutDashboard, roles: ['USER', 'ARENDATOR', 'ADMIN'] },
  { href: '/kabinet/elonlarim', label: 'Eʼlonlarim', icon: ListChecks, roles: ['ARENDATOR', 'ADMIN'] },
  { href: '/kabinet/arizalar', label: 'Arizalar', icon: Inbox, roles: ['USER', 'ARENDATOR', 'ADMIN'] },
  { href: '/kabinet/saqlanganlar', label: 'Saqlanganlar', icon: Heart, roles: ['USER', 'ARENDATOR', 'ADMIN'] },
  { href: '/kabinet/sozlamalar', label: 'Sozlamalar', icon: Settings, roles: ['USER', 'ARENDATOR', 'ADMIN'] },
  { href: '/admin', label: 'Admin panel', icon: ShieldCheck, roles: ['ADMIN'] },
] as const

function useVisibleItems(role: Role) {
  return ITEMS.filter((item) => (item.roles as readonly string[]).includes(role))
}

function useIsActive() {
  const pathname = usePathname()
  return (href: string) =>
    href === '/kabinet' ? pathname === '/kabinet' : pathname.startsWith(href)
}

/** Kengroq ekran: chapdagi vertikal roʻyxat */
export function CabinetNav({ role }: { role: Role }) {
  const items = useVisibleItems(role)
  const isActive = useIsActive()

  return (
    <nav className="space-y-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-colors',
            isActive(item.href)
              ? 'bg-primary-soft text-primary'
              : 'text-muted hover:bg-surface-2 hover:text-text',
          )}
        >
          <item.icon className="size-[18px]" aria-hidden />
          {item.label}
        </Link>
      ))}

      {role !== 'USER' ? (
        <Link
          href="/kabinet/elon/yangi"
          className="mt-2 flex items-center justify-center gap-2 rounded-[10px] bg-primary px-3 py-2.5 text-[14px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
        >
          <Plus className="size-[18px]" aria-hidden /> Eʼlon joylash
        </Link>
      ) : null}
    </nav>
  )
}

/**
 * Telefon: yonma-yon suriladigan qator.
 * Vertikal roʻyxat mobilda butun ekranni egallab, asosiy kontentni
 * pastga surib yuborardi — shuning uchun alohida koʻrinish.
 */
export function CabinetNavMobile({ role }: { role: Role }) {
  const items = useVisibleItems(role)
  const isActive = useIsActive()

  return (
    <nav
      aria-label="Kabinet boʻlimlari"
      className="hide-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors',
            isActive(item.href)
              ? 'border-primary bg-primary-soft text-primary'
              : 'border-border text-muted hover:border-border-strong hover:text-text',
          )}
        >
          <item.icon className="size-4" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
