'use client'

import { Link, useMessages, usePathnameWithoutLocale } from '@/i18n/client'
import { Calculator, CarFront, Home, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Mobil uchun pastki navigatsiya — barmoq eng oson yetadigan zona.
 * Telefonda foydalanuvchi asosiy 5 ta yoʻnalishga bir tegishda oʻtadi,
 * shuning uchun yuqoridagi "burger" menyu ikkilamchi boʻlib qoladi.
 */

const ITEMS = [
  { href: '/', key: 'home' as const, icon: Home, exact: true },
  { href: '/elonlar', key: 'cars' as const, icon: CarFront },
  { href: '/kabinet/elon/yangi', key: 'post' as const, icon: Plus, fab: true },
  { href: '/kalkulyator', key: 'calculator' as const, icon: Calculator },
  { href: '/kabinet', key: 'profile' as const, icon: User },
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
  const pathname = usePathnameWithoutLocale()
  const t = useMessages().common.bottomNav

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      aria-label={t.aria}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-lg lg:hidden"
    >
      <ul className="flex h-[var(--bottomnav-h)] items-stretch">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          if (item.fab) {
            return (
              <li key={item.href} className="flex flex-1 items-start justify-center">
                <Link
                  href={item.href}
                  aria-label={t[item.key]}
                  className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg ring-4 ring-surface transition-transform active:scale-95"
                >
                  <item.icon className="size-7" strokeWidth={2.4} aria-hidden />
                </Link>
              </li>
            )
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 px-1 transition-colors',
                  active ? 'font-semibold text-primary' : 'text-muted',
                )}
              >
                <item.icon
                  className="size-[22px]"
                  strokeWidth={active ? 2.4 : 1.8}
                  aria-hidden
                />
                <span className="text-[10px] font-medium leading-none">{t[item.key]}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
