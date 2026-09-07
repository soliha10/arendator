import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireArendator } from '@/lib/auth/guards'
import { getBrandsWithModels, getRegions } from '@/server/listings'
import { ListingForm } from '@/components/listing-form/listing-form'

export const metadata: Metadata = { title: 'Yangi eʼlon' }

export default async function NewListingPage() {
  const user = await requireArendator('/kabinet/elon/yangi')
  const [brands, regions] = await Promise.all([getBrandsWithModels(), getRegions()])

  return (
    <div>
      <Link
        href="/kabinet/elonlarim"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" /> Eʼlonlarim
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-text">Yangi eʼlon</h1>
      <p className="mt-1.5 text-sm text-muted">
        Avtomobil maʼlumotlari va toʻlov shartlarini kiriting — grafik avtomatik
        hisoblanadi.
      </p>

      <div className="mt-6">
        <ListingForm
          brands={brands.map((b) => ({ id: b.id, name: b.name, models: b.models }))}
          regions={regions.map((r) => ({ id: r.id, name: r.name }))}
          defaultPhone={user.phone}
          defaultName={user.fullName}
        />
      </div>
    </div>
  )
}
