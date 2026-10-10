'use client'

import { Link, useMessages, usePathnameWithoutLocale } from '@/i18n/client'
import { Building2, Crown, LayoutDashboard, ShieldAlert, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS: { href: string; key: 'overview' | 'moderation' | 'promotions' | 'dealers' | 'users'; icon: typeof Users }[] = [
  { href: '/admin', key: 'overview', icon: LayoutDashboard },
  { href: '/admin/moderatsiya', key: 'moderation', icon: ShieldAlert },
  { href: '/admin/reklama', key: 'promotions', icon: Crown },
  { href: '/admin/arendatorlar', key: 'dealers', icon: Building2 },
  { href: '/admin/foydalanuvchilar', key: 'users', icon: Users },
]

export function AdminNav() {
  const pathname = usePathnameWithoutLocale()
  const t = useMessages().admin.nav
  return (
    <nav className="hide-scrollbar flex gap-1.5 overflow-x-auto">
      {ITEMS.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[10px] border px-3.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border text-muted hover:border-border-strong hover:text-text',
            )}
          >
            <item.icon className="size-4" />
            {t[item.key]}
          </Link>
        )
      })}
    </nav>
  )
}
