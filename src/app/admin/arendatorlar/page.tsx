import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Star } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatDateLong, formatPhone } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty'
import { VerifyButton } from './verify-button'

export const metadata: Metadata = { title: 'Arendatorlar · Admin' }

export default async function AdminArendatorsPage() {
  const profiles = await prisma.arendatorProfile.findMany({
    orderBy: [{ isVerified: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, slug: true, companyName: true, legalName: true, inn: true,
      isVerified: true, verifiedAt: true, listingCount: true,
      ratingAvg: true, reviewCount: true, createdAt: true,
      region: { select: { name: true } },
      user: { select: { fullName: true, phone: true, email: true } },
      _count: { select: { reviews: true } },
    },
  })

  if (profiles.length === 0) {
    return <EmptyState title="Arendator yoʻq" description="Hali hech kim roʻyxatdan oʻtmagan." />
  }

  const unverified = profiles.filter((p) => !p.isVerified).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Jami <span className="tabular font-medium text-text">{profiles.length}</span> ta ·
        tasdiqlanmagan{' '}
        <span className="tabular font-medium text-warning">{unverified}</span> ta
      </p>

      {/* Telefon: har bir arendator — alohida karta */}
      <ul className="space-y-2 md:hidden">
        {profiles.map((p) => (
          <li key={p.id} className="card p-4">
            <Link
              href={`/arendator/${p.slug}`}
              target="_blank"
              className="font-medium text-text hover:text-primary"
            >
              {p.companyName}
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {p.isVerified ? (
                <Badge variant="success" size="sm">
                  <ShieldCheck /> Tasdiqlangan
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Tekshirilmagan
                </Badge>
              )}
              {p.region ? (
                <span className="text-[12px] text-subtle">{p.region.name}</span>
              ) : null}
            </div>

            <div className="mt-3 border-t border-border pt-3 text-[13px]">
              <p className="text-text">{p.user.fullName}</p>
              <p className="tabular text-[12px] text-muted">{formatPhone(p.user.phone)}</p>
            </div>

            <dl className="tabular mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
              <div className="flex gap-1">
                <dt>STIR:</dt>
                <dd className="text-text">{p.inn ?? '—'}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Eʼlon:</dt>
                <dd className="font-medium text-text">{p.listingCount}</dd>
              </div>
              {p.reviewCount > 0 ? (
                <div className="flex items-center gap-1">
                  <dt className="sr-only">Reyting</dt>
                  <dd className="inline-flex items-center gap-1 text-text">
                    <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                    {p.ratingAvg.toFixed(1)}
                    <span className="text-subtle">({p.reviewCount})</span>
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-3 border-t border-border pt-3">
              <VerifyButton profileId={p.id} isVerified={p.isVerified} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-[14px] border border-border md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-surface-2 text-left text-[12px] uppercase tracking-wide text-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">Kompaniya</th>
              <th className="px-4 py-3 font-semibold">Masʼul shaxs</th>
              <th className="px-4 py-3 font-semibold">STIR</th>
              <th className="px-4 py-3 text-center font-semibold">Eʼlon</th>
              <th className="px-4 py-3 text-center font-semibold">Reyting</th>
              <th className="px-4 py-3 font-semibold">Roʻyxatdan</th>
              <th className="px-4 py-3 text-right font-semibold">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-surface-2/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/arendator/${p.slug}`}
                    target="_blank"
                    className="font-medium text-text hover:text-primary"
                  >
                    {p.companyName}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {p.isVerified ? (
                      <Badge variant="success" size="sm">
                        <ShieldCheck /> Tasdiqlangan
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Tekshirilmagan
                      </Badge>
                    )}
                    {p.region ? (
                      <span className="text-[12px] text-subtle">{p.region.name}</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[13px] text-text">{p.user.fullName}</p>
                  <p className="tabular text-[12px] text-muted">
                    {formatPhone(p.user.phone)}
                  </p>
                </td>
                <td className="tabular px-4 py-3 text-[13px] text-muted">
                  {p.inn ?? '—'}
                </td>
                <td className="tabular px-4 py-3 text-center text-[13px] text-text">
                  {p.listingCount}
                </td>
                <td className="px-4 py-3 text-center">
                  {p.reviewCount > 0 ? (
                    <span className="tabular inline-flex items-center gap-1 text-[13px] text-text">
                      <Star className="size-3.5 fill-accent text-accent" />
                      {p.ratingAvg.toFixed(1)}
                      <span className="text-subtle">({p.reviewCount})</span>
                    </span>
                  ) : (
                    <span className="text-[13px] text-subtle">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] text-muted">
                  {formatDateLong(p.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <VerifyButton profileId={p.id} isVerified={p.isVerified} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
