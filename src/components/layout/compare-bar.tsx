'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scale, X } from 'lucide-react'
import { useCompare } from '@/lib/compare-store'
import { MAX_COMPARE_ITEMS } from '@/lib/constants'
import { Button } from '@/components/ui/button'

/** Sahifa pastida suzib turuvchi taqqoslash paneli */
export function CompareBar() {
  const { items, count, isReady, remove, clear } = useCompare()
  const pathname = usePathname()

  if (!isReady || count === 0 || pathname === '/taqqoslash') return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
      <div className="container-page">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-surface/95 p-2.5 surface-shadow backdrop-blur-lg">
          <div className="hidden shrink-0 items-center gap-2 pl-2 text-sm font-medium text-text sm:flex">
            <Scale className="size-[18px] text-primary" />
            Taqqoslash
            <span className="tabular text-subtle">
              {count}/{MAX_COMPARE_ITEMS}
            </span>
          </div>

          <ul className="hide-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
            {items.map((item) => (
              <li key={item.id} className="relative shrink-0">
                <Link
                  href={`/elon/${item.slug}`}
                  title={item.title}
                  className="block size-14 overflow-hidden rounded-xl border border-border bg-surface-2"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={56}
                      height={56}
                      className="size-full object-cover"
                    />
                  ) : null}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`${item.title} ni olib tashlash`}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-danger"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clear} className="hidden sm:inline-flex">
              Tozalash
            </Button>
            <Button asChild size="sm" disabled={count < 2}>
              <Link href="/taqqoslash">
                Taqqoslash {count >= 2 ? `(${count})` : ''}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
