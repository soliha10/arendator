'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown, Heart, LayoutGrid, LogOut, Menu, Plus,
  Scale, Settings, ShieldCheck, User, X,
} from 'lucide-react'
import type { Role } from '@prisma/client'
import { logoutAction } from '@/server/actions/auth'
import { useCompare } from '@/lib/compare-store'
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'

export interface HeaderUser {
  id: string
  fullName: string
  role: Role
  avatarUrl: string | null
}

const NAV_LINKS = [
  { href: '/elonlar', label: 'Eʼlonlar' },
  { href: '/arendatorlar', label: 'Arendatorlar' },
  { href: '/kalkulyator', label: 'Kalkulyator' },
]

export function CompareLink({ className }: { className?: string }) {
  const { count, isReady } = useCompare()
  return (
    <Link
      href="/taqqoslash"
      className={cn(
        'relative inline-flex h-9 items-center gap-2 rounded-[10px] px-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text',
        className,
      )}
    >
      <Scale className="size-[18px]" />
      <span className="hidden lg:inline">Taqqoslash</span>
      {isReady && count > 0 ? (
        <span className="tabular absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">
          {count}
        </span>
      ) : null}
    </Link>
  )
}

export function UserMenu({ user }: { user: HeaderUser }) {
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
          <span className="hidden max-w-28 truncate text-sm font-medium text-text sm:inline">
            {user.fullName.split(' ')[0]}
          </span>
          <ChevronDown className="size-4 text-subtle" />
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>{user.fullName}</DropdownLabel>
        <DropdownItem asChild>
          <Link href="/kabinet">
            <LayoutGrid /> Kabinet
          </Link>
        </DropdownItem>
        {user.role !== 'USER' ? (
          <DropdownItem asChild>
            <Link href="/kabinet/elonlarim">
              <LayoutGrid /> Mening eʼlonlarim
            </Link>
          </DropdownItem>
        ) : null}
        <DropdownItem asChild>
          <Link href="/kabinet/saqlanganlar">
            <Heart /> Saqlanganlar
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/kabinet/sozlamalar">
            <Settings /> Sozlamalar
          </Link>
        </DropdownItem>
        {user.role === 'ADMIN' ? (
          <>
            <DropdownSeparator />
            <DropdownItem asChild>
              <Link href="/admin">
                <ShieldCheck /> Admin panel
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
          <LogOut /> Chiqish
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  )
}

export function DesktopNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV_LINKS.map((link) => {
        const active = pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-[10px] px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-surface-2 text-text' : 'text-muted hover:bg-surface-2 hover:text-text',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileNav({ user }: { user: HeaderUser | null }) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
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
        aria-label="Menyu"
        className="inline-flex size-9 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-surface-2 hover:text-text md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col border-l border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-text">Menyu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-2"
                aria-label="Yopish"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-[10px] px-3 py-2.5 text-[15px] font-medium text-text hover:bg-surface-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/taqqoslash"
                  className="block rounded-[10px] px-3 py-2.5 text-[15px] font-medium text-text hover:bg-surface-2"
                >
                  Taqqoslash
                </Link>
              </div>

              <div className="my-4 h-px bg-border" />

              {user ? (
                <div className="space-y-1">
                  <Link href="/kabinet" className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[15px] text-text hover:bg-surface-2">
                    <LayoutGrid className="size-[18px] text-subtle" /> Kabinet
                  </Link>
                  <Link href="/kabinet/saqlanganlar" className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[15px] text-text hover:bg-surface-2">
                    <Heart className="size-[18px] text-subtle" /> Saqlanganlar
                  </Link>
                  <Link href="/kabinet/sozlamalar" className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[15px] text-text hover:bg-surface-2">
                    <Settings className="size-[18px] text-subtle" /> Sozlamalar
                  </Link>
                  {user.role === 'ADMIN' ? (
                    <Link href="/admin" className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[15px] text-text hover:bg-surface-2">
                      <ShieldCheck className="size-[18px] text-subtle" /> Admin panel
                    </Link>
                  ) : null}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[15px] text-danger hover:bg-surface-2"
                    >
                      <LogOut className="size-[18px]" /> Chiqish
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button asChild block variant="outline">
                    <Link href="/kirish">
                      <User /> Kirish
                    </Link>
                  </Button>
                  <Button asChild block>
                    <Link href="/royxatdan-otish">Roʻyxatdan oʻtish</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <Button asChild block size="lg">
                <Link href="/kabinet/elon/yangi">
                  <Plus /> Eʼlon joylash
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
