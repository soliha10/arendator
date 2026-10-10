import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/guards'
import { Header } from '@/components/layout/header'
import { AdminNav } from './admin-nav'

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await requireAdmin('/admin')

  return (
    <>
      <Header />
      <div className="container-page flex-1 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">Admin panel</h1>
            <p className="mt-1 text-sm text-muted">
              Moderatsiya, arendatorlar va tizim sozlamalari
            </p>
          </div>
          <Link
            href="/kabinet"
            className="text-sm font-medium text-primary hover:underline"
          >
            Kabinetga qaytish
          </Link>
        </div>

        <AdminNav />
        <div className="mt-5">{children}</div>
      </div>
    </>
  )
}
