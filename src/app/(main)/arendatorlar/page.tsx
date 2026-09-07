import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, MapPin, ShieldCheck, Star } from 'lucide-react'
import { getAllArendators } from '@/server/profiles'
import { formatMoney } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty'

export const metadata: Metadata = {
  title: 'Arendatorlar',
  description:
    'Avtomobilni rassrochka va arendaga beruvchi kompaniyalar roʻyxati, reytingi va sharhlari.',
}

export const revalidate = 120

export default async function ArendatorsPage() {
  const arendators = await getAllArendators()
  const verifiedCount = arendators.filter((a) => a.isVerified).length

  return (
    <div className="container-page py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text">Arendatorlar</h1>
        <p className="mt-1.5 text-sm text-muted">
          <span className="tabular font-medium text-text">{arendators.length}</span> ta
          kompaniya · shundan{' '}
          <span className="tabular font-medium text-success">{verifiedCount}</span> tasi
          tasdiqlangan
        </p>
      </div>

      {arendators.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {arendators.map((a) => (
            <Link
              key={a.id}
              href={`/arendator/${a.slug}`}
              className="card group p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-base font-bold text-primary">
                  {a.companyName.slice(0, 2).toUpperCase()}
                </span>
                {a.isVerified ? (
                  <Badge variant="success" size="sm">
                    <ShieldCheck /> Tasdiqlangan
                  </Badge>
                ) : null}
              </div>

              <h2 className="mt-3.5 line-clamp-1x text-[15px] font-semibold text-text group-hover:text-primary">
                {a.companyName}
              </h2>

              {a.regionName ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <MapPin className="size-3.5 text-subtle" /> {a.regionName}
                </p>
              ) : null}

              <p className="mt-2 line-clamp-3x text-[13px] leading-relaxed text-muted">
                {a.about ?? 'Maʼlumot kiritilmagan'}
              </p>

              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3.5 text-center">
                <div>
                  <dd className="tabular text-sm font-bold text-text">
                    {a.listingCount}
                  </dd>
                  <dt className="text-[11px] text-subtle">eʼlon</dt>
                </div>
                <div>
                  <dd className="tabular inline-flex items-center gap-1 text-sm font-bold text-text">
                    {a.ratingAvg > 0 ? (
                      <>
                        <Star className="size-3.5 fill-accent text-accent" />
                        {a.ratingAvg.toFixed(1)}
                      </>
                    ) : (
                      '—'
                    )}
                  </dd>
                  <dt className="text-[11px] text-subtle">{a.reviewCount} sharh</dt>
                </div>
                <div>
                  <dd className="tabular text-sm font-bold text-text">
                    {a.minMonthlyUzs
                      ? formatMoney(a.minMonthlyUzs, 'UZS', { compact: true, withSuffix: false })
                      : '—'}
                  </dd>
                  <dt className="text-[11px] text-subtle">oyiga, dan</dt>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 />}
          title="Hali arendator yoʻq"
          description="Birinchi boʻlib roʻyxatdan oʻting va avtomobillaringizni joylang."
        />
      )}
    </div>
  )
}
