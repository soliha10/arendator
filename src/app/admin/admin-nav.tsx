'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, ShieldAlert, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/admin', label: 'Umumiy', icon: LayoutDashboard },
  { href: '/admin/moderatsiya', label: 'Moderatsiya', icon: ShieldAlert },
  { href: '/admin/arendatorlar', label: 'Arendatorlar', icon: Building2 },
  { href: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users },
]

export function AdminNav() {
  const pathname = usePathname()
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
              'inline-flex shrink-0 items-center gap-2 rounded-[10px] border px-3.5 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border text-muted hover:border-border-strong hover:text-text',
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
