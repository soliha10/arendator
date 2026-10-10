import type { Metadata } from 'next'
import { ArrowLeft, BadgeCheck, Headphones } from 'lucide-react'
import { requireUser } from '@/lib/auth/guards'
import { getBrandsWithModels, getRegions } from '@/server/listings'
import { getRates } from '@/server/exchange'
import { formatPhone } from '@/lib/format'
import { SITE } from '@/lib/site'
import { ListingForm } from '@/components/listing-form/listing-form'
import { Link } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { regionLabel } from '@/i18n/labels'
import { getMessages } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages()
  return { title: m.form.meta.newTitle, robots: { index: false } }
}

/**
 * Jismoniy shaxs ham eʼlon bera oladi: birinchi eʼlon saqlanganda
 * saveListingAction foydalanuvchiga eʼlon beruvchi huquqlarini ochadi.
 */
export default async function NewListingPage() {
  const user = await requireUser('/kabinet/elon/yangi')
  const [brands, regions, rates, m] = await Promise.all([
    getBrandsWithModels(),
    getRegions(),
    getRates(),
    getMessages(),
  ])
  const t = m.form.page

  return (
    <div>
      <Link
        href="/kabinet/elonlarim"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" /> {t.back}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary">
            <BadgeCheck className="size-4" /> {fmt(t.badge, { name: SITE.name })}
          </p>
          <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
            {t.heading}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            {t.intro}
          </p>
        </div>
        <a
          href={`tel:${SITE.phone}`}
          className="hidden items-center gap-3 rounded-xl bg-surface-2 px-4 py-2.5 sm:flex"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Headphones className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block text-[11px] text-muted">{t.help}</span>
            <span className="tabular block text-[14px] font-bold text-text">{formatPhone(SITE.phone)}</span>
          </span>
        </a>
      </div>

      <div className="mt-6">
        <ListingForm
          brands={brands.map((b) => ({ id: b.id, name: b.name, models: b.models }))}
          regions={regions
            .map((r) => ({ id: r.id, name: regionLabel(m, r.slug, r.name) }))
            .sort((a, b) => a.name.localeCompare(b.name))}
          defaultPhone={user.phone}
          defaultName={user.fullName}
          usdRate={rates.USD}
        />
      </div>
    </div>
  )
}
