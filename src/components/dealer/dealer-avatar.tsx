import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Diler logotipi yoki nomidan ikki harf; tasdiqlangan bo'lsa yashil belgi */
export function DealerAvatar({
  name,
  logoUrl,
  verified = false,
  size = 'md',
  className,
  verifiedLabel,
}: {
  name: string
  logoUrl: string | null
  verified?: boolean
  size?: 'md' | 'lg'
  className?: string
  /** Ekran o'quvchilar uchun: "Tasdiqlangan diler" joriy tilda */
  verifiedLabel?: string
}) {
  const initials = name
    .replace(/["“”«»]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-xl bg-primary-soft font-display font-extrabold text-primary',
        size === 'lg' ? 'size-20 text-2xl' : 'size-14 text-lg',
        className,
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          fill
          sizes={size === 'lg' ? '80px' : '56px'}
          className="rounded-xl object-cover"
        />
      ) : (
        initials
      )}
      {verified ? (
        <BadgeCheck
          className="absolute -bottom-1.5 -right-1.5 size-5 rounded-full bg-surface text-success"
          aria-label={verifiedLabel}
          aria-hidden={verifiedLabel ? undefined : true}
        />
      ) : null}
    </span>
  )
}
