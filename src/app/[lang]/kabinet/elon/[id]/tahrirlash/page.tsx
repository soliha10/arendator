import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/lib/auth/guards'
import { getRates } from '@/server/exchange'
import { prisma } from '@/lib/prisma'
import { getBrandsWithModels, getRegions } from '@/server/listings'
import { ListingForm } from '@/components/listing-form/listing-form'
import { newKey, type ListingFormState } from '@/components/listing-form/types'
import { Badge } from '@/components/ui/badge'
import { Link } from '@/i18n/client'
import { regionLabel } from '@/i18n/labels'
import { getMessages } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages()
  return { title: m.form.meta.editTitle, robots: { index: false } }
}

const numStr = (v: unknown): string =>
  v === null || v === undefined ? '' : String(v)

export default async function EditListingPage(
  props: PageProps<'/[lang]/kabinet/elon/[id]/tahrirlash'>,
) {
  const { id } = await props.params
  const user = await requireUser(`/kabinet/elon/${id}/tahrirlash`)

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }] },
      plans: { orderBy: [{ isDefault: 'desc' }, { termMonths: 'asc' }] },
    },
  })

  if (!listing) notFound()
  if (listing.ownerId !== user.id && user.role !== 'ADMIN') notFound()

  const [brands, regions, rates, m] = await Promise.all([
    getBrandsWithModels(),
    getRegions(),
    getRates(),
    getMessages(),
  ])
  const t = m.form.page

  const firstPlan = listing.plans[0]

  const initial: ListingFormState = {
    id: listing.id,
    title: listing.title,
    description: listing.description ?? '',
    brandId: listing.brandId,
    modelId: listing.modelId,
    year: String(listing.year),
    bodyType: listing.bodyType,
    transmission: listing.transmission,
    fuelType: listing.fuelType,
    driveType: listing.driveType,
    engineVolume: numStr(listing.engineVolume),
    color: listing.color ?? '',
    mileage: String(listing.mileage),
    condition: listing.condition,
    seats: numStr(listing.seats) || '5',
    regionId: listing.regionId,
    address: listing.address ?? '',
    contactPhone: listing.contactPhone,
    contactName: listing.contactName ?? '',
    telegram: listing.telegram ?? '',
    latitude: listing.latitude,
    longitude: listing.longitude,
    // Formada bitta narx: shartlar bo'lsa ularning bazasi, bo'lmasa naqd narx
    carPrice: firstPlan ? numStr(firstPlan.carPrice) : numStr(listing.cashPrice),
    currency: firstPlan?.currency ?? listing.cashCurrency,
    hasCashSale: listing.hasCashSale,
    isNegotiable: listing.isNegotiable,
    features: listing.features,
    images: listing.images.map((img) => ({
      url: img.url,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      blurDataUrl: img.blurDataUrl ?? undefined,
    })),
    plans: listing.plans.map((p) => ({
      key: newKey(),
      id: p.id,
      name: p.name,
      planType: p.planType,
      calcMethod: p.calcMethod,
      downPayment: numStr(p.downPayment),
      termMonths: String(p.termMonths),
      annualRatePercent: numStr(p.markupPercent),
      monthlyPaymentInput:
        p.calcMethod === 'FIXED' ? numStr(p.monthlyPayment) : '',
      paymentDay: String(p.paymentDay),
      startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : '',
      depositAmount: numStr(p.depositAmount),
      dailyPayment: numStr(p.dailyPayment),
      insuranceIncluded: p.insuranceIncluded,
      cascoIncluded: p.cascoIncluded,
      maintenanceIncluded: p.maintenanceIncluded,
      mileageLimitPerYear: numStr(p.mileageLimitPerYear),
      extraMileageFee: numStr(p.extraMileageFee),
      ownershipTransfer: p.ownershipTransfer,
      earlyPayoffAllowed: p.earlyPayoffAllowed,
      penaltyPerDay: numStr(p.penaltyPerDay),
      requiredDocuments: p.requiredDocuments ?? '',
      notes: p.notes ?? '',
      isDefault: p.isDefault,
    })),
  }

  return (
    <div>
      <Link
        href="/kabinet/elonlarim"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" /> {t.back}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
          {t.editHeading}
        </h1>
        <Badge
          variant={
            listing.status === 'ACTIVE'
              ? 'success'
              : listing.status === 'REJECTED'
                ? 'danger'
                : listing.status === 'PENDING'
                  ? 'warning'
                  : 'default'
          }
        >
          {m.enums.listingStatus[listing.status]}
        </Badge>
      </div>

      {listing.rejectReason ? (
        <p className="mt-3 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger">
          <strong>{t.rejectReason}</strong> {listing.rejectReason}
        </p>
      ) : null}

      <p className="mt-1.5 text-sm text-muted">
        {t.editNote}
      </p>

      <div className="mt-6">
        <ListingForm
          brands={brands.map((b) => ({ id: b.id, name: b.name, models: b.models }))}
          regions={regions
            .map((r) => ({ id: r.id, name: regionLabel(m, r.slug, r.name) }))
            .sort((a, b) => a.name.localeCompare(b.name))}
          initial={initial}
          defaultPhone={user.phone}
          defaultName={user.fullName}
          usdRate={rates.USD}
        />
      </div>
    </div>
  )
}
