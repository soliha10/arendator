'use client'

import Image from 'next/image'
import { Link, useMessages, usePathnameWithoutLocale } from '@/i18n/client'
import { fmt } from '@/i18n/format'
import { Scale, X } from 'lucide-react'
import { useCompare } from '@/lib/compare-store'
import { MAX_COMPARE_ITEMS } from '@/lib/constants'
import { Button } from '@/components/ui/button'

/**
 * Sahifa pastida suzib turuvchi taqqoslash paneli.
 * Mobilda pastki navigatsiya ustida turadi va faqat eng zarur
 * maʼlumotni koʻrsatadi — rasmchalar oʻrniga sanoq va tugma.
 */
export function CompareBar() {
  const { items, count, isReady, remove, clear } = useCompare()
  const pathname = usePathnameWithoutLocale()
  const t = useMessages().common.compareBar

  if (!isReady || count === 0 || pathname === '/taqqoslash') return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottomnav-h)+var(--safe-b))] z-40 p-3 sm:p-4 lg:bottom-0">
      <div className="container-page">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-surface/95 p-2.5 surface-shadow backdrop-blur-lg">
          <div className="flex shrink-0 items-center gap-2 pl-1 text-sm font-medium text-text sm:pl-2">
            <Scale className="size-4.5 text-primary" aria-hidden />
            <span className="hidden sm:inline">{t.title}</span>
            <span className="tabular text-subtle">
              {count}/{MAX_COMPARE_ITEMS}
            </span>
          </div>

          {/* Rasmchalar faqat kengroq ekranlarda — telefonda joy tor */}
          <ul className="hide-scrollbar hidden flex-1 items-center gap-2 overflow-x-auto sm:flex">
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
                  aria-label={fmt(t.removeItem, { title: item.title })}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-danger"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clear} className="hidden sm:inline-flex">
              {t.clearShort}
            </Button>
            <Button asChild size="sm" disabled={count < 2}>
              <Link href="/taqqoslash">
                {t.open} {count >= 2 ? `(${count})` : ''}
              </Link>
            </Button>
            <button
              type="button"
              onClick={clear}
              aria-label={t.clear}
              className="tap -mr-1 inline-flex items-center justify-center rounded-[10px] text-subtle transition-colors hover:text-danger sm:hidden"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
