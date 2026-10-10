'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Link, useMessages, usePathnameWithoutLocale } from '@/i18n/client'
import {
  Bell, ChevronDown, Heart, LayoutGrid, LogOut, Menu, Plus,
  Scale, Settings, ShieldCheck, User, X,
} from 'lucide-react'
import type { Role } from '@prisma/client'
import { logoutAction } from '@/server/actions/auth'
import { useCompare } from '@/lib/compare-store'
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { Button } from '@/components/ui/button'
import { ThemeSwitch, ThemeToggle } from './theme-toggle'
import { LanguageSegmented } from './language-switcher'
import { cn } from '@/lib/utils'

export interface HeaderUser {
  id: string
  fullName: string
  role: Role
  avatarUrl: string | null
}

type NavKey = 'all' | 'rent' | 'installment' | 'calculator' | 'dealers'

const NAV_LINKS: { href: string; key: NavKey; match: (p: string, q: string) => boolean }[] = [
  { href: '/elonlar', key: 'all', match: (p: string, q: string) => p === '/elonlar' && !q.includes('planType=') },
  { href: '/elonlar?planType=RENT', key: 'rent', match: (p: string, q: string) => p === '/elonlar' && q.includes('planType=RENT') },
  { href: '/elonlar?planType=INSTALLMENT', key: 'installment', match: (p: string, q: string) => p === '/elonlar' && q.includes('planType=INSTALLMENT') },
  { href: '/kalkulyator', key: 'calculator', match: (p: string) => p.startsWith('/kalkulyator') },
  { href: '/dilerlar', key: 'dealers', match: (p: string) => p.startsWith('/dilerlar') || p.startsWith('/arendator') },
]

const iconLinkClass =
  'relative inline-flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text'

function CountBadge({ count, tone = 'primary' }: { count: number; tone?: 'primary' | 'danger' }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'tabular absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-[18px] ring-2 ring-surface',
        tone === 'danger' ? 'bg-danger text-white' : 'bg-primary text-primary-fg',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function SavedLink({ className }: { className?: string }) {
  const t = useMessages().common.nav
  return (
    <Link href="/kabinet/saqlanganlar" aria-label={t.saved} className={cn(iconLinkClass, className)}>
      <Heart className="size-4.75" />
    </Link>
  )
}

export function NotificationBell({ count }: { count: number }) {
  const t = useMessages().common.nav
  return (
    <Link
      href="/kabinet/xabarnomalar"
      aria-label={count > 0 ? t.notificationsUnread.replace('{n}', String(count)) : t.notifications}
      className={iconLinkClass}
    >
      <Bell className="size-4.75" />
      <CountBadge count={count} tone="danger" />
    </Link>
  )
}

export function CompareLink({ className }: { className?: string }) {
  const { count, isReady } = useCompare()
  const t = useMessages().common.nav
  return (
    <Link
      href="/taqqoslash"
      aria-label={t.compare}
      className={cn(iconLinkClass, className)}
    >
      <Scale className="size-4.75" />
      {isReady ? <CountBadge count={count} /> : null}
    </Link>
  )
}

export function UserMenu({ user }: { user: HeaderUser }) {
  const c = useMessages().common
  const t = c.userMenu
  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-[10px] pl-1 pr-2 transition-colors hover:bg-surface-2"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
            {initials}
          </span>
          <span className="hidden flex-col items-start leading-tight xl:flex">
            <span className="max-w-28 truncate text-[13px] font-semibold text-text">
              {user.fullName.split(' ')[0]}
            </span>
            <span className="text-[11px] text-subtle">
              {user.role === 'ARENDATOR'
                ? c.header.roleDealer
                : user.role === 'ADMIN'
                  ? c.header.roleAdmin
                  : c.header.roleUser}
            </span>
          </span>
          <ChevronDown className="size-4 text-subtle" />
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>{user.fullName}</DropdownLabel>
        <DropdownItem asChild>
          <Link href="/kabinet">
            <LayoutGrid /> {t.cabinet}
          </Link>
        </DropdownItem>
        {user.role !== 'USER' ? (
          <DropdownItem asChild>
            <Link href="/kabinet/elonlarim">
              <LayoutGrid /> {t.myListings}
            </Link>
          </DropdownItem>
        ) : null}
        <DropdownItem asChild>
          <Link href="/kabinet/saqlanganlar">
            <Heart /> {t.saved}
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/kabinet/xabarnomalar">
            <Bell /> {t.notifications}
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/kabinet/sozlamalar">
            <Settings /> {t.settings}
          </Link>
        </DropdownItem>
        {user.role === 'ADMIN' ? (
          <>
            <DropdownSeparator />
            <DropdownItem asChild>
              <Link href="/admin">
                <ShieldCheck /> {t.admin}
              </Link>
            </DropdownItem>
          </>
        ) : null}
        <DropdownSeparator />
        <DropdownItem
          danger
          onSelect={(e) => {
            e.preventDefault()
            void logoutAction()
          }}
        >
          <LogOut /> {t.logout}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  )
}

export function DesktopNav() {
  const pathname = usePathnameWithoutLocale()
  const query = useSearchParams().toString()
  const t = useMessages().common.nav
  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t.mainAria}>
      {NAV_LINKS.map((link) => {
        const active = link.match(pathname, query)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
              active
                ? 'bg-primary text-primary-fg'
                : 'text-text hover:bg-surface-2',
            )}
          >
            {t[link.key]}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileNav({ user, unread = 0 }: { user: HeaderUser | null; unread?: number }) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathnameWithoutLocale()
  const c = useMessages().common
  const t = c.nav
  const u = c.userMenu
  const [lastPathname, setLastPathname] = React.useState(pathname)

  // Boshqa sahifaga oʻtilganda menyu yopiladi
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    if (open) setOpen(false)
  }

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.menu}
        className="tap -mr-1.5 inline-flex items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-surface-2 hover:text-text lg:hidden"
      >
        <Menu className="size-5.5" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col border-l border-border bg-surface pt-safe">
            <div className="flex items-center justify-between border-b border-border py-2 pl-4 pr-2">
              <span className="text-[15px] font-semibold text-text">{t.menu}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="tap inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface-2"
                aria-label={t.close}
              >
                <X className="size-5.5" aria-hidden />
              </button>
            </div>

            <div className="scroll-contain flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex min-h-12 items-center rounded-[10px] px-3 text-[15px] font-medium text-text hover:bg-surface-2"
                  >
                    {t[link.key]}
                  </Link>
                ))}
                <Link
                  href="/taqqoslash"
                  className="flex min-h-12 items-center rounded-[10px] px-3 text-[15px] font-medium text-text hover:bg-surface-2"
                >
                  {t.compare}
                </Link>
                <Link
                  href="/qollanma"
                  className="flex min-h-12 items-center rounded-[10px] px-3 text-[15px] font-medium text-text hover:bg-surface-2"
                >
                  {t.help}
                </Link>
              </div>

              <div className="mt-3 space-y-3 px-1">
                <div>
                  <p className="mb-1.5 px-2 text-[12px] font-semibold uppercase tracking-wide text-subtle">{t.language}</p>
                  <LanguageSegmented />
                </div>
                <div>
                  <p className="mb-1.5 px-2 text-[12px] font-semibold uppercase tracking-wide text-subtle">{t.theme}</p>
                  <ThemeSwitch />
                </div>
              </div>

              <div className="my-4 h-px bg-border" />

              {user ? (
                <div className="space-y-1">
                  <Link href="/kabinet" className="flex min-h-12 items-center gap-2.5 rounded-[10px] px-3 text-[15px] text-text hover:bg-surface-2">
                    <LayoutGrid className="size-4.5 text-subtle" /> {u.cabinet}
                  </Link>
                  <Link href="/kabinet/saqlanganlar" className="flex min-h-12 items-center gap-2.5 rounded-[10px] px-3 text-[15px] text-text hover:bg-surface-2">
                    <Heart className="size-4.5 text-subtle" /> {u.saved}
                  </Link>
                  <Link href="/kabinet/xabarnomalar" className="flex min-h-12 items-center gap-2.5 rounded-[10px] px-3 text-[15px] text-text hover:bg-surface-2">
                    <Bell className="size-4.5 text-subtle" /> {u.notifications}
                    {unread > 0 ? (
                      <span className="tabular ml-auto rounded-full bg-danger px-2 text-[11px] font-bold leading-5 text-white">{unread}</span>
                    ) : null}
                  </Link>
                  <Link href="/kabinet/sozlamalar" className="flex min-h-12 items-center gap-2.5 rounded-[10px] px-3 text-[15px] text-text hover:bg-surface-2">
                    <Settings className="size-4.5 text-subtle" /> {u.settings}
                  </Link>
                  {user.role === 'ADMIN' ? (
                    <Link href="/admin" className="flex min-h-12 items-center gap-2.5 rounded-[10px] px-3 text-[15px] text-text hover:bg-surface-2">
                      <ShieldCheck className="size-4.5 text-subtle" /> {u.admin}
                    </Link>
                  ) : null}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex min-h-12 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[15px] text-danger hover:bg-surface-2"
                    >
                      <LogOut className="size-4.5" /> {u.logout}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button asChild block variant="outline">
                    <Link href="/kirish">
                      <User /> {c.header.login}
                    </Link>
                  </Button>
                  <Button asChild block>
                    <Link href="/royxatdan-otish">{c.header.register}</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4 pb-[calc(1rem+var(--safe-b))]">
              <Button asChild block size="lg">
                <Link href="/kabinet/elon/yangi">
                  <Plus /> {c.header.postAd}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export { ThemeToggle }
