import { ExternalLink, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { getMessages } from '@/i18n/server'

export interface DealerPoint {
  slug: string
  name: string
  address: string | null
  regionSlug: string | null
  lat: number
  lng: number
}

const osmLink = (p: DealerPoint) =>
  `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=16/${p.lat}/${p.lng}`

/**
 * Xarita kutubxonasisiz: OpenStreetMap'ning tayyor embed sahifasi.
 * Bitta marker ko'rsatadi — ro'yxatdagi diler tanlanganda (`?nuqta=`)
 * xarita o'sha manzilga markazlashadi. JS talab qilinmaydi.
 */
export async function DealerMap({
  points,
  activeSlug,
  buildHref,
}: {
  points: DealerPoint[]
  activeSlug?: string
  buildHref: (slug: string) => string
}) {
  if (points.length === 0) return null
  const t = (await getMessages()).dealers.map
  const active = points.find((p) => p.slug === activeSlug) ?? points[0]
  const d = 0.012
  const bbox = [active.lng - d * 1.6, active.lat - d, active.lng + d * 1.6, active.lat + d].join(',')
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${active.lat},${active.lng}`

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-2">
        <iframe
          key={active.slug}
          title={fmt(t.iframeTitle, { name: active.name })}
          src={src}
          loading="lazy"
          className="block h-[320px] w-full sm:h-[380px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 rounded-lg bg-surface/95 px-3 py-2 shadow-sm backdrop-blur sm:right-auto">
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-text">{active.name}</span>
            {active.address ? (
              <span className="block truncate text-[11px] text-muted">{active.address}</span>
            ) : null}
          </span>
          <a
            href={osmLink(active)}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-primary-fg"
          >
            {t.route} <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>
      </div>

      <ul className="max-h-[380px] space-y-1.5 overflow-y-auto scroll-contain pr-1">
        {points.map((p) => {
          const isActive = p.slug === active.slug
          return (
            <li key={p.slug}>
              <Link
                href={buildHref(p.slug)}
                scroll={false}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg border p-3 transition-colors',
                  isActive ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:bg-surface-2',
                )}
              >
                <MapPin className={cn('mt-0.5 size-4 shrink-0', isActive ? 'text-primary' : 'text-subtle')} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-text">{p.name}</span>
                  {p.address ? <span className="block truncate text-[12px] text-muted">{p.address}</span> : null}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
