import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('group inline-flex shrink-0 items-center gap-2.5', className)}
      aria-label="Arendator — bosh sahifa"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-fg">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          <path
            d="M3 13.5 4.6 9a3 3 0 0 1 2.8-2h9.2a3 3 0 0 1 2.8 2L21 13.5V18a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="14.5" r="1.1" fill="currentColor" />
          <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="whitespace-nowrap text-[17px] font-bold tracking-tight text-text">
            Arendator
          </span>
          <span className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-subtle">
            avtomobil rassrochkasi
          </span>
        </span>
      ) : null}
    </Link>
  )
}
