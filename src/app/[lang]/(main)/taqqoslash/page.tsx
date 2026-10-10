import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CompareTable } from './compare-table'
import { getLocale, getMessages } from '@/i18n/server'
import { alternatesFor } from '@/i18n/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [m, locale] = await Promise.all([getMessages(), getLocale()])
  return {
    title: m.compare.meta.title,
    description: m.compare.meta.description,
    alternates: alternatesFor('/taqqoslash', locale),
    // Taqqoslash ro'yxati shaxsiy — qidiruvda indekslash shart emas
    robots: { index: false, follow: true },
  }
}

export default async function ComparePage() {
  const t = (await getMessages()).compare.page
  return (
    <div className="container-page py-6 lg:py-10">
      <p className="text-[12px] font-bold uppercase tracking-wider text-primary">{t.badge}</p>
      <h1 className="mt-1 text-[28px] font-extrabold text-text sm:text-[36px]">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{t.intro}</p>

      <div className="mt-6">
        <Suspense fallback={<div className="skeleton h-96 rounded-xl" />}>
          <CompareTable />
        </Suspense>
      </div>
    </div>
  )
}
