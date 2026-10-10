import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/guards'
import { Header } from '@/components/layout/header'
import { AdminNav } from './admin-nav'
import { Link } from '@/i18n/client'
import { getMessages } from '@/i18n/server'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: LayoutProps<'/[lang]/admin'>) {
  await requireAdmin('/admin')
  const t = (await getMessages()).admin.layout

  return (
    <>
      <Header />
      <div className="container-page flex-1 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">{t.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {t.subtitle}
            </p>
          </div>
          <Link
            href="/kabinet"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t.back}
          </Link>
        </div>

        <AdminNav />
        <div className="mt-5">{children}</div>
      </div>
    </>
  )
}
