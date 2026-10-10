import { Suspense } from 'react'
import { CircleHelp, MapPin, Phone, PlusCircle } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { getRates } from '@/server/exchange'
import { formatPhone } from '@/lib/format'
import { SITE } from '@/lib/site'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/client'
import { getMessages } from '@/i18n/server'
import { LanguageSwitcher } from './language-switcher'
import { Logo } from './logo'
import { SearchBar } from './search-bar'
import { HeaderSearchRow } from './header-search-row'
import {
  CompareLink, DesktopNav, MobileNav, NotificationBell,
  SavedLink, ThemeToggle, UserMenu,
} from './header-nav'

/**
 * Yuqori ingichka qator: shahar, Markaziy bank kursi, qo'llab-quvvatlash.
 * Kurs bazadan o'qiladi — admin panelda yangilanadi.
 */
async function TopBar() {
  const [rates, m] = await Promise.all([getRates(), getMessages()])
  const usd = Math.round(rates.USD)
  const t = m.common.topbar

  return (
    <div className="hidden border-b border-border bg-surface-2 text-[12px] text-muted lg:block">
      <div className="container-page flex h-10 items-center gap-4">
        <span className="inline-flex items-center gap-1.5 font-semibold text-text">
          <MapPin className="size-3.5 text-primary" aria-hidden /> {t.city}
        </span>
        <span className="h-4 w-px bg-border-strong/60" aria-hidden />
        <span className="tabular">
          {t.rate}{' '}
          <strong className="font-semibold text-text">
            1 USD = {String(usd).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} UZS
          </strong>
          <span className="ml-1.5 rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">
            {t.centralBank}
          </span>
        </span>

        <div className="ml-auto flex items-center gap-4">
          <a
            href={`tel:${SITE.phone}`}
            className="tabular inline-flex items-center gap-1.5 font-semibold text-text hover:text-primary"
          >
            <Phone className="size-3.5 text-primary" aria-hidden /> {formatPhone(SITE.phone)}
          </a>
          <span className="h-4 w-px bg-border-strong/60" aria-hidden />
          <Link href="/qollanma" className="inline-flex items-center gap-1.5 hover:text-text">
            <CircleHelp className="size-3.5" aria-hidden /> {t.help}
          </Link>
          <span className="h-4 w-px bg-border-strong/60" aria-hidden />
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}

export async function Header() {
  const [user, m] = await Promise.all([getCurrentUser(), getMessages()])
  const th = m.common.header
  const headerUser = user
    ? {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }
    : null

  const unread = user
    ? await prisma.notification.count({ where: { userId: user.id, readAt: null } })
    : 0

  return (
    <>
      <TopBar />
      {/*
        Yopishqoq qism faqat bitta qator — mobilda 56px.
        Qidiruv pastda, yopishqoq boʻlmagan qatorda turadi: sahifa
        aylantirilganda u koʻzdan yoʻqoladi va ekran boʻshaydi.
      */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-lg">
        <div className="container-page">
          <div className="flex h-[var(--header-h)] items-center gap-3 xl:gap-5">
            <Logo />

            <div className="hidden w-64 shrink-0 2xl:block">
              <Suspense fallback={null}>
                <SearchBar compact placeholder={th.searchPlaceholder} />
              </Suspense>
            </div>

            <Suspense fallback={<div className="hidden flex-1 lg:block" />}>
              <DesktopNav />
            </Suspense>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <CompareLink className="hidden md:inline-flex" />
              <SavedLink />
              {headerUser ? <NotificationBell count={unread} /> : null}
              {/* Telefonda joy tor — mavzu va profil menyusi burger ichida */}
              <span className="hidden sm:contents">
                <ThemeToggle />
              </span>

              <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
                <Link href={headerUser ? '/kabinet/elon/yangi' : '/royxatdan-otish?next=/kabinet/elon/yangi'}>
                  <PlusCircle /> {th.postAd}
                </Link>
              </Button>

              {headerUser ? (
                <span className="hidden sm:contents">
                  <UserMenu user={headerUser} />
                </span>
              ) : (
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/kirish">{th.login}</Link>
                </Button>
              )}

              <MobileNav user={headerUser} unread={unread} />
            </div>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <HeaderSearchRow />
      </Suspense>
    </>
  )
}
