import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/guards'
import { getCabinetCounts } from '@/server/cabinet'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { CabinetNav } from './cabinet-nav'

/** Shaxsiy kabinet qidiruv tizimlariga ko'rsatilmaydi */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function CabinetLayout({ children }: LayoutProps<'/[lang]/kabinet'>) {
  const user = await requireUser('/kabinet')
  const c = await getCabinetCounts(user.id)
  const seller = user.role !== 'USER'

  return (
    <>
      <Header />
      <div className="container-page flex-1 py-4 pb-nav sm:py-6 lg:pb-8">
        <CabinetNav
          role={user.role}
          counts={{
            listings: c.listings,
            leads: seller ? c.newLeads : c.myLeads,
            leadsAreNew: seller,
            saved: c.favorites + c.savedSearches,
            unread: c.unread,
          }}
        />
        <div className="mt-5 min-w-0 sm:mt-6">{children}</div>
      </div>
      <BottomNav />
    </>
  )
}
