import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireUser } from '@/lib/auth/guards'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { CabinetNav, CabinetNavMobile } from './cabinet-nav'

export default async function CabinetLayout({ children }: LayoutProps<'/kabinet'>) {
  const user = await requireUser('/kabinet')

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <>
      <Header />
      <div className="container-page flex-1 py-4 pb-nav sm:py-6 lg:pb-6">
        {/* Telefon: ixcham profil qatori + yonma-yon suriladigan boʻlimlar */}
        <div className="mb-4 lg:hidden">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-text">
                {user.fullName}
              </p>
              <p className="truncate text-[12px] text-muted">{user.phone}</p>
            </div>
            {user.role !== 'USER' ? (
              <Link
                href="/kabinet/elon/yangi"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-primary px-3.5 text-[13px] font-medium text-primary-fg"
              >
                <Plus className="size-4" aria-hidden /> Eʼlon
              </Link>
            ) : null}
          </div>
          <CabinetNavMobile role={user.role} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="card sticky top-[calc(var(--header-h)+1rem)] p-3">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-text">
                    {user.fullName}
                  </p>
                  <p className="truncate text-[12px] text-muted">{user.phone}</p>
                </div>
              </div>
              <CabinetNav role={user.role} />
              {user.role === 'USER' ? (
                <div className="mt-3 rounded-xl border border-dashed border-border-strong p-3">
                  <p className="text-[12px] leading-relaxed text-muted">
                    Avtomobil arendaga qoʻymoqchimisiz?
                  </p>
                  <Link
                    href="/kabinet/sozlamalar#arendator"
                    className="mt-1.5 inline-block text-[13px] font-medium text-primary hover:underline"
                  >
                    Arendator boʻlish →
                  </Link>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <BottomNav />
    </>
  )
}
