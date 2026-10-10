'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, Scale, Search, User } from 'lucide-react'
import { useCompare } from '@/lib/compare-store'
import { cn } from '@/lib/utils'

/**
 * Mobil uchun pastki navigatsiya — barmoq eng oson yetadigan zona.
 * Telefonda foydalanuvchi asosiy 5 ta yoʻnalishga bir tegishda oʻtadi,
 * shuning uchun yuqoridagi "burger" menyu ikkilamchi boʻlib qoladi.
 */

const ITEMS = [
  { href: '/', label: 'Bosh sahifa', icon: Home, exact: true },
  { href: '/elonlar', label: 'Eʼlonlar', icon: Search },
  { href: '/taqqoslash', label: 'Taqqoslash', icon: Scale, badge: 'compare' as const },
  { href: '/kabinet/saqlanganlar', label: 'Saqlangan', icon: Heart },
  { href: '/kabinet', label: 'Kabinet', icon: User, exact: true },
]

/**
 * Pastki panel yashiriladigan sahifalar: eʼlon sahifasida oʻrnini
 * "Ariza" paneli egallaydi, eʼlon tahrirlashda esa formaning oʻz
 * yopishqoq paneli bor — ikkitasi ustma-ust tushmasligi kerak.
 */
const HIDDEN_PREFIXES = [
  '/elon/',
  '/kabinet/elon/',
  '/kirish',
  '/royxatdan-otish',
  '/admin',
]

export function BottomNav() {
  const pathname = usePathname()
  const { count, isReady } = useCompare()

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      aria-label="Asosiy navigatsiya"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-lg lg:hidden"
    >
      <ul className="flex h-[var(--bottomnav-h)] items-stretch">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const showBadge = item.badge === 'compare' && isReady && count > 0

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 px-1 transition-colors',
                  active ? 'text-primary' : 'text-subtle',
                )}
              >
                <span className="relative">
                  <item.icon
                    className="size-[22px]"
                    strokeWidth={active ? 2.4 : 1.8}
                    aria-hidden
                  />
                  {showBadge ? (
                    <span className="tabular absolute -right-2 -top-1.5 flex min-w-[17px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-[17px] text-primary-fg">
                      {count}
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
