'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from 'lucide-react'
import type { ImageDto } from '@/server/mappers'
import { cn } from '@/lib/utils'

export function Gallery({ images, title }: { images: ImageDto[]; title: string }) {
  const [index, setIndex] = React.useState(0)
  const [lightbox, setLightbox] = React.useState(false)

  const total = images.length
  const go = React.useCallback(
    (delta: number) => setIndex((i) => (i + delta + total) % total),
    [total],
  )

  React.useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, go])

  if (total === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-[14px] border border-border bg-surface-2 text-subtle">
        <ImageOff className="size-10" />
      </div>
    )
  }

  const current = images[index]

  return (
    <>
      <div className="space-y-3">
        <div className="group relative aspect-[16/10] overflow-hidden rounded-[14px] border border-border bg-surface-2">
          <Image
            src={current.url}
            alt={`${title} — ${index + 1}-rasm`}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
            placeholder={current.blurDataUrl ? 'blur' : undefined}
            blurDataURL={current.blurDataUrl ?? undefined}
            priority
          />

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Oldingi rasm"
                className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/65 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Keyingi rasm"
                className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/65 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Kattalashtirish"
            className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-lg bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65"
          >
            <Expand className="size-4" />
          </button>

          <span className="tabular pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">
            {index + 1} / {total}
          </span>
        </div>

        {total > 1 ? (
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}-rasm`}
                aria-current={i === index}
                className={cn(
                  'relative aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                  i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4">
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Yopish"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          <div className="relative h-[80vh] w-full max-w-6xl">
            <Image
              src={current.url}
              alt={`${title} — ${index + 1}-rasm`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Oldingi rasm"
                className="absolute left-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Keyingi rasm"
                className="absolute right-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
              <span className="tabular absolute bottom-6 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">
                {index + 1} / {total}
              </span>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
