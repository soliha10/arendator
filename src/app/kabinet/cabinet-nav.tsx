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

export function CabinetNav({ role }: { role: Role }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-0.5">
      {ITEMS.filter((item) => (item.roles as readonly string[]).includes(role)).map(
        (item) => {
          const active =
            item.href === '/kabinet'
              ? pathname === '/kabinet'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-colors',
                active
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted hover:bg-surface-2 hover:text-text',
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          )
        },
      )}

      {role !== 'USER' ? (
        <Link
          href="/kabinet/elon/yangi"
          className="mt-2 flex items-center justify-center gap-2 rounded-[10px] bg-primary px-3 py-2.5 text-[14px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
        >
          <Plus className="size-[18px]" /> Eʼlon joylash
        </Link>
      ) : null}
    </nav>
  )
}
