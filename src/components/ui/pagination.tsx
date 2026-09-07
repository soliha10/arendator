import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Sahifalar ro'yxati: 1 … 4 5 [6] 7 8 … 20 */
function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

export function Pagination({
  page,
  pageCount,
  buildHref,
  className,
}: {
  page: number
  pageCount: number
  buildHref: (page: number) => string
  className?: string
}) {
  if (pageCount <= 1) return null
  const pages = buildPages(page, pageCount)

  const base =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] border px-3 text-sm font-medium transition-colors'

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Sahifalar">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className={cn(base, 'border-border bg-surface text-text hover:bg-surface-2')}
          aria-label="Oldingi sahifa"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(base, 'border-border bg-surface-2 text-subtle')} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-subtle">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className={cn(base, 'tabular border-primary bg-primary text-primary-fg')}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={cn(base, 'tabular border-border bg-surface text-text hover:bg-surface-2')}
          >
            {p}
          </Link>
        ),
      )}

      {page < pageCount ? (
        <Link
          href={buildHref(page + 1)}
          className={cn(base, 'border-border bg-surface text-text hover:bg-surface-2')}
          aria-label="Keyingi sahifa"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(base, 'border-border bg-surface-2 text-subtle')} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}
