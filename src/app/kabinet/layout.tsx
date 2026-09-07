import Link from 'next/link'
import { requireUser } from '@/lib/auth/guards'
import { Header } from '@/components/layout/header'
import { CabinetNav } from './cabinet-nav'

export default async function CabinetLayout({ children }: LayoutProps<'/kabinet'>) {
  const user = await requireUser('/kabinet')

  return (
    <>
      <Header />
      <div className="container-page flex-1 py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside>
            <div className="card sticky top-20 p-3">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary">
                  {user.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
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
    </>
  )
}
