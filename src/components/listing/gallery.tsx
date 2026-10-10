'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from 'lucide-react'
import type { ImageDto } from '@/server/mappers'
import { cn } from '@/lib/utils'

/**
 * Gorizontal "snap" karusel.
 *
 * Sensorli qurilmada rasm barmoq bilan suriladi — bu telefonda kutilgan
 * xatti-harakat. Strelkalar esa faqat sichqoncha bor qurilmada chiqadi:
 * ilgari ular `group-hover` ga bogʻlangan edi va telefonda umuman
 * koʻrinmasdi, ya'ni ikkinchi rasmga oʻtishning yoʻli yoʻq edi.
 */
function useCarousel(total: number) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [index, setIndex] = React.useState(0)

  const scrollTo = React.useCallback((i: number, smooth = true) => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const go = React.useCallback(
    (delta: number) => {
      const next = (index + delta + total) % total
      setIndex(next)
      scrollTo(next)
    },
    [index, total, scrollTo],
  )

  const onScroll = React.useCallback(() => {
    const el = ref.current
    if (!el || el.clientWidth === 0) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    setIndex((prev) => (prev === i ? prev : i))
  }, [])

  return { ref, index, setIndex, go, scrollTo, onScroll }
}

const ARROW_BASE =
  'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center ' +
  'rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70 ' +
  '[@media(hover:hover)]:flex'

export function Gallery({ images, title }: { images: ImageDto[]; title: string }) {
  const total = images.length
  const [lightbox, setLightbox] = React.useState(false)
  const { ref, index, setIndex, go, scrollTo, onScroll } = useCarousel(total)

  if (total === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-[14px] border border-border bg-surface-2 text-subtle sm:aspect-[16/10]">
        <ImageOff className="size-10" aria-hidden />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="group relative overflow-hidden rounded-[14px] border border-border bg-surface-2">
          <div
            ref={ref}
            onScroll={onScroll}
            className="hide-scrollbar snap-row"
            aria-roledescription="karusel"
            aria-label={`${title} rasmlari`}
          >
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightbox(true)}
                aria-label={`${i + 1}-rasmni kattalashtirish`}
                className="snap-item relative aspect-[4/3] w-full shrink-0 sm:aspect-[16/10]"
              >
                <Image
                  src={img.url}
                  alt={`${title} — ${i + 1}-rasm`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  placeholder={img.blurDataUrl ? 'blur' : undefined}
                  blurDataURL={img.blurDataUrl ?? undefined}
                  priority={i === 0}
                />
              </button>
            ))}
          </div>

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Oldingi rasm"
                className={cn(ARROW_BASE, 'left-3')}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Keyingi rasm"
                className={cn(ARROW_BASE, 'right-3')}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="Kattalashtirish"
            className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-lg bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70"
          >
            <Expand className="size-4" aria-hidden />
          </button>

          <span className="tabular pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur">
            {index + 1} / {total}
          </span>
        </div>

        {/* Telefonda — nuqtalar, kengroq ekranda — rasmchalar */}
        {total > 1 ? (
          <>
            <div className="flex items-center justify-center gap-1.5 sm:hidden">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setIndex(i)
                    scrollTo(i)
                  }}
                  aria-label={`${i + 1}-rasmga oʻtish`}
                  aria-current={i === index}
                  className="flex h-6 items-center px-1"
                >
                  <span
                    className={cn(
                      'block h-1.5 rounded-full transition-all',
                      i === index ? 'w-5 bg-primary' : 'w-1.5 bg-border-strong',
                    )}
                  />
                </button>
              ))}
            </div>

            <div className="hide-scrollbar hidden gap-2 overflow-x-auto sm:flex">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setIndex(i)
                    scrollTo(i)
                  }}
                  aria-label={`${i + 1}-rasm`}
                  aria-current={i === index}
                  className={cn(
                    'relative aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                    i === index
                      ? 'border-primary'
                      : 'border-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {lightbox ? (
        <Lightbox
          images={images}
          title={title}
          startIndex={index}
          onClose={(finalIndex) => {
            setLightbox(false)
            setIndex(finalIndex)
            scrollTo(finalIndex, false)
          }}
        />
      ) : null}
    </>
  )
}

function Lightbox({
  images,
  title,
  startIndex,
  onClose,
}: {
  images: ImageDto[]
  title: string
  startIndex: number
  onClose: (index: number) => void
}) {
  const total = images.length
  const { ref, index, go, scrollTo, onScroll } = useCarousel(total)

  // Ochilganda joriy rasmdan boshlanadi va sahifa ortida aylanmaydi
  React.useEffect(() => {
    scrollTo(startIndex, false)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(index)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose, index])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 pb-safe pt-safe"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — rasmlar`}
    >
      <div className="flex items-center justify-between p-3">
        <span className="tabular rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => onClose(index)}
          aria-label="Yopish"
          className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex-1">
        <div
          ref={ref}
          onScroll={onScroll}
          className="hide-scrollbar snap-row h-full items-center"
        >
          {images.map((img, i) => (
            <div key={img.id} className="snap-item relative h-full w-full shrink-0">
              <Image
                src={img.url}
                alt={`${title} — ${i + 1}-rasm`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          ))}
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Oldingi rasm"
              className={cn(ARROW_BASE, 'left-4 bg-white/10 hover:bg-white/20')}
            >
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Keyingi rasm"
              className={cn(ARROW_BASE, 'right-4 bg-white/10 hover:bg-white/20')}
            >
              <ChevronRight className="size-6" aria-hidden />
            </button>
          </>
        ) : null}
      </div>

      <p className="pb-2 text-center text-[12px] text-white/50 [@media(hover:hover)]:hidden">
        Rasmni barmoq bilan suring
      </p>
    </div>
  )
}
