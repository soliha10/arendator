import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatMoney, formatRelative, formatTerm } from '@/lib/format'
import { EmptyState } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { ModerationActions } from './moderation-actions'

export const metadata: Metadata = { title: 'Moderatsiya' }

export default async function ModerationPage() {
  const listings = await prisma.listing.findMany({
    where: { status: 'PENDING' },
    orderBy: { updatedAt: 'asc' },
    select: {
      id: true, slug: true, title: true, year: true, mileage: true,
      updatedAt: true, description: true,
      images: { orderBy: { position: 'asc' }, take: 4, select: { id: true, url: true } },
      region: { select: { name: true } },
      owner: {
        select: {
          fullName: true, phone: true,
          profile: { select: { companyName: true, slug: true, isVerified: true } },
        },
      },
      plans: {
        orderBy: { termMonths: 'asc' },
        select: {
          id: true, name: true, currency: true, carPrice: true,
          downPayment: true, monthlyPayment: true, termMonths: true,
          markupPercent: true, totalPayable: true,
        },
      },
    },
  })

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 />}
        title="Moderatsiya navbati boʻsh"
        description="Barcha eʼlonlar koʻrib chiqilgan. Yangi eʼlon kelganda shu yerda paydo boʻladi."
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        <span className="tabular font-medium text-text">{listings.length}</span> ta eʼlon
        koʻrib chiqishni kutmoqda
      </p>

      {listings.map((l) => (
        <article key={l.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-text">{l.title}</h2>
                <Badge variant="warning" size="sm">
                  {formatRelative(l.updatedAt)}
                </Badge>
              </div>
              <p className="mt-1 text-[13px] text-muted">
                {l.owner.profile?.companyName ?? l.owner.fullName}
                {l.owner.profile?.isVerified ? ' · tasdiqlangan' : ''} ·{' '}
                {l.region.name} · {l.year} · {l.mileage.toLocaleString('uz-UZ')} km
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/elon/${l.slug}`}
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border px-3 text-[13px] font-medium text-muted transition-colors hover:text-text"
              >
                <ExternalLink className="size-4" /> Koʻrish
              </Link>
              <ModerationActions listingId={l.id} />
            </div>
          </div>

          {l.images.length > 0 ? (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {l.images.map((img) => (
                <span
                  key={img.id}
                  className="relative aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-lg bg-surface-2"
                >
                  <Image src={img.url} alt="" fill sizes="128px" className="object-cover" />
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
              Rasm yuklanmagan
            </p>
          )}

          {l.description ? (
            <p className="mt-3 line-clamp-3x text-[13px] leading-relaxed text-muted">
              {l.description}
            </p>
          ) : null}

          {l.plans.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead className="bg-surface-2 text-left text-[12px] uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Shart</th>
                    <th className="px-3 py-2 text-right font-semibold">Narx</th>
                    <th className="px-3 py-2 text-right font-semibold">Boshlangʻich</th>
                    <th className="px-3 py-2 text-right font-semibold">Oylik</th>
                    <th className="px-3 py-2 text-right font-semibold">Muddat</th>
                    <th className="px-3 py-2 text-right font-semibold">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {l.plans.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-text">{p.name}</td>
                      <td className="tabular px-3 py-2 text-right text-muted">
                        {formatMoney(Number(p.carPrice), p.currency, { compact: true })}
                      </td>
                      <td className="tabular px-3 py-2 text-right text-muted">
                        {formatMoney(Number(p.downPayment), p.currency, { compact: true })}
                      </td>
                      <td className="tabular px-3 py-2 text-right font-semibold text-text">
                        {formatMoney(Number(p.monthlyPayment), p.currency, { compact: true })}
                      </td>
                      <td className="tabular px-3 py-2 text-right text-muted">
                        {formatTerm(p.termMonths)}
                      </td>
                      <td className="tabular px-3 py-2 text-right text-muted">
                        {formatMoney(Number(p.totalPayable), p.currency, { compact: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
              Toʻlov sharti kiritilmagan
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
