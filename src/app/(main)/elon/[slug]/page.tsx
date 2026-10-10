import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Armchair, Calendar, CarFront, Circle, Droplets, Eye, Fuel,
  Gauge, Heart, MapPin, Settings2, ShieldCheck, Star,
} from 'lucide-react'
import { getListingBySlug, getSimilarListings, incrementViewCount } from '@/server/listings'
import { getCurrentUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import {
  BODY_TYPE_LABELS, CONDITION_LABELS, DRIVE_TYPE_LABELS,
  FUEL_TYPE_LABELS, TRANSMISSION_LABELS,
} from '@/lib/constants'
import { formatCount, formatDateLong, formatMileage, formatMoney } from '@/lib/format'
import { Gallery } from '@/components/listing/gallery'
import { PlanViewer } from '@/components/listing/plan-viewer'
import { LeadForm } from '@/components/listing/lead-form'
import { CompareButton, FavoriteButton } from '@/components/listing/listing-actions'
import { PriceCard } from '@/components/listing/price-card'
import { MobileCta } from '@/components/listing/mobile-cta'
import { ListingGrid } from '@/components/listing/listing-grid'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  props: PageProps<'/elon/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params
  const listing = await getListingBySlug(slug)
  if (!listing) return { title: 'Eʼlon topilmadi' }

  const monthly = listing.minMonthlyPaymentUzs
    ? formatMoney(listing.minMonthlyPaymentUzs, 'UZS', { compact: true })
    : null

  return {
    title: `${listing.title}${monthly ? ` — oyiga ${monthly}` : ''}`,
    description:
      listing.description?.slice(0, 160) ??
      `${listing.title} rassrochkaga. ${monthly ? `Oylik toʻlov ${monthly}.` : ''}`,
    openGraph: {
      title: listing.title,
      images: listing.images[0] ? [{ url: listing.images[0].url }] : undefined,
    },
  }
}

const SPEC_ICONS = {
  year: Calendar,
  mileage: Gauge,
  body: CarFront,
  transmission: Settings2,
  fuel: Fuel,
  drive: Circle,
  engine: Droplets,
  seats: Armchair,
} as const

export default async function ListingPage(props: PageProps<'/elon/[slug]'>) {
  const { slug } = await props.params
  const listing = await getListingBySlug(slug)
  if (!listing) notFound()

  const user = await getCurrentUser()
  const isOwner = user?.id === listing.owner.id

  // Faol bo'lmagan e'lonni faqat egasi va admin ko'ra oladi
  if (listing.status !== 'ACTIVE' && !isOwner && user?.role !== 'ADMIN') {
    notFound()
  }

  const [favorited, similar] = await Promise.all([
    user
      ? prisma.favorite
          .findUnique({
            where: { userId_listingId: { userId: user.id, listingId: listing.id } },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
    getSimilarListings(listing, 4),
  ])

  if (!isOwner) void incrementViewCount(listing.id)

  const specs = [
    { key: 'year', label: 'Ishlab chiqarilgan yil', value: String(listing.year) },
    { key: 'mileage', label: 'Yurgan masofa', value: formatMileage(listing.mileage) },
    { key: 'body', label: 'Kuzov', value: BODY_TYPE_LABELS[listing.bodyType] },
    {
      key: 'transmission',
      label: 'Uzatmalar qutisi',
      value: TRANSMISSION_LABELS[listing.transmission],
    },
    { key: 'fuel', label: 'Yoqilgʻi', value: FUEL_TYPE_LABELS[listing.fuelType] },
    { key: 'drive', label: 'Uzatma', value: DRIVE_TYPE_LABELS[listing.driveType] },
    {
      key: 'engine',
      label: 'Dvigatel hajmi',
      value: listing.engineVolume ? `${listing.engineVolume} L` : '—',
    },
    { key: 'seats', label: 'Oʻrindiqlar', value: listing.seats ? `${listing.seats} ta` : '—' },
  ] as const

  const priceCardProps = {
    monthlyUzs: listing.minMonthlyPaymentUzs,
    downUzs: listing.minDownPaymentUzs,
    carPriceUzs: listing.carPriceUzs,
    minTermMonths: listing.minTermMonths,
    maxTermMonths: listing.maxTermMonths,
    planCount: listing.plans.length,
  }

  return (
    <div className="container-page py-4 pb-[calc(4.5rem+var(--safe-b))] sm:py-6 lg:pb-6">
      {/* Non */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        <Link href="/" className="hover:text-text">Bosh sahifa</Link>
        <span className="text-subtle">/</span>
        <Link href="/elonlar" className="hover:text-text">Eʼlonlar</Link>
        <span className="text-subtle">/</span>
        <Link href={`/elonlar?brand=${listing.brandName.toLowerCase()}`} className="hover:text-text">
          {listing.brandName}
        </Link>
        <span className="text-subtle">/</span>
        <span className="text-text">{listing.modelName}</span>
      </nav>

      {listing.status !== 'ACTIVE' ? (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          Bu eʼlon hozircha chop etilmagan — uni faqat siz koʻryapsiz.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Chap ustun ─────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <div>
            <div className="mb-3">
              <div className="min-w-0">
                <h1 className="text-[22px] font-bold leading-tight tracking-tight text-text sm:text-2xl">
                  {listing.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-subtle" /> {listing.regionName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="size-3.5 text-subtle" />
                    {formatCount(listing.viewCount)} marta koʻrilgan
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="size-3.5 text-subtle" />
                    {listing.favoriteCount} ta saqlangan
                  </span>
                  {listing.publishedAt ? (
                    <span>{formatDateLong(listing.publishedAt)}</span>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                <FavoriteButton
                  listingId={listing.id}
                  initialFavorited={favorited}
                  withLabel
                  className="w-full sm:w-auto"
                />
                <CompareButton
                  item={{
                    id: listing.id,
                    slug: listing.slug,
                    title: listing.title,
                    imageUrl: listing.images[0]?.url ?? null,
                  }}
                  withLabel
                  className="w-full sm:w-auto"
                />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant={listing.condition === 'NEW' ? 'success' : 'default'}>
                {CONDITION_LABELS[listing.condition]}
              </Badge>
              {listing.hasInstallment ? <Badge variant="primary">Rassrochka</Badge> : null}
              {listing.hasRent ? <Badge variant="default">Arenda</Badge> : null}
              {listing.color ? <Badge variant="default">{listing.color}</Badge> : null}
            </div>

            <Gallery images={listing.images} title={listing.title} />

            {/* Telefonda asosiy raqamlar darhol koʻrinadi */}
            <PriceCard {...priceCardProps} className="mt-4 lg:hidden" />
          </div>

          {/* Xususiyatlar */}
          <section className="card p-5">
            <h2 className="mb-4 text-lg font-semibold text-text">Xususiyatlar</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3">
              {specs.map((spec) => {
                const Icon = SPEC_ICONS[spec.key]
                return (
                  <div
                    key={spec.key}
                    className="flex items-center gap-2.5 border-b border-border py-3 last:border-0"
                  >
                    <Icon className="size-4 shrink-0 text-subtle" />
                    <div className="min-w-0">
                      <dt className="text-[12px] text-muted">{spec.label}</dt>
                      <dd className="truncate text-[13px] font-medium text-text">
                        {spec.value}
                      </dd>
                    </div>
                  </div>
                )
              })}
            </dl>
          </section>

          {/* To'lov shartlari + grafik */}
          <PlanViewer plans={listing.plans} />

          {/* Tavsif */}
          {listing.description ? (
            <section className="card p-5">
              <h2 className="mb-3 text-lg font-semibold text-text">Tavsif</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted">
                {listing.description}
              </p>
            </section>
          ) : null}
        </div>

        {/* ── O'ng ustun (yopishqoq) ─────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
          {/* Asosiy narx kartasi — kengroq ekranda */}
          <PriceCard {...priceCardProps} className="hidden lg:block" />

          {/* Arendator */}
          <div className="card p-5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
              Arendator
            </p>
            <div className="mt-3 flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-[15px] font-bold text-primary">
                {listing.ownerName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                {listing.owner.slug ? (
                  <Link
                    href={`/arendator/${listing.owner.slug}`}
                    className="line-clamp-1x font-semibold text-text hover:text-primary"
                  >
                    {listing.ownerName}
                  </Link>
                ) : (
                  <p className="line-clamp-1x font-semibold text-text">{listing.ownerName}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                  {listing.owner.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <ShieldCheck className="size-3.5" /> Tasdiqlangan
                    </span>
                  ) : null}
                  {listing.owner.reviewCount > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-accent text-accent" />
                      <span className="tabular">{listing.owner.ratingAvg.toFixed(1)}</span>
                      ({listing.owner.reviewCount})
                    </span>
                  ) : null}
                  <span className="tabular">{listing.owner.listingCount} ta eʼlon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ariza formasi */}
          {!isOwner ? (
            <div id="ariza" className="scroll-offset">
              <LeadForm
                listingId={listing.id}
                plans={listing.plans}
                contactPhone={listing.contactPhone}
                defaultName={user?.fullName ?? ''}
                defaultPhone={user?.phone ?? ''}
              />
            </div>
          ) : (
            <div className="card p-5 text-center">
              <p className="text-sm text-muted">Bu sizning eʼloningiz</p>
              <Link
                href={`/kabinet/elon/${listing.id}/tahrirlash`}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                Eʼlonni tahrirlash
              </Link>
            </div>
          )}

          <p className="px-1 text-[12px] leading-relaxed text-subtle">
            Shartnoma imzolashdan oldin barcha shartlarni yozma tasdiqlang.
            Oldindan toʻlov soʻralsa — ehtiyot boʻling.
          </p>
        </aside>
      </div>

      {!isOwner ? (
        <MobileCta
          monthlyUzs={listing.minMonthlyPaymentUzs}
          contactPhone={listing.contactPhone}
        />
      ) : null}

      {/* O'xshash e'lonlar */}
      {similar.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-text">Oʻxshash takliflar</h2>
          <ListingGrid listings={similar} columns={4} />
        </section>
      ) : null}
    </div>
  )
}
