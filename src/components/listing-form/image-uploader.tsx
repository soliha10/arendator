'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, CloudUpload, GripVertical, ImagePlus, Loader2, Plus, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { MAX_LISTING_IMAGES, MAX_UPLOAD_MB } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useLocale, useMessages } from '@/i18n/client'
import { fmt, plural } from '@/i18n/format'
import type { ImageDraft } from './types'

export function ImageUploader({
  images,
  onChange,
}: {
  images: ImageDraft[]
  onChange: (images: ImageDraft[]) => void
}) {
  const locale = useLocale()
  const t = useMessages().form.photos
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState({ done: 0, total: 0 })
  const [dragOver, setDragOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  /**
   * Har bir rasm alohida soʻrovda ketadi.
   *
   * Hammasini bitta formData'ga yigʻsak, serverless funksiyaning
   * soʻrov tanasi limitiga (Vercel'da ~4.5 MB) urilamiz va bir nechta
   * telefon fotosurati birdaniga 413 beradi. Bittalab yuborilganda
   * limitga faqat bitta fayl hisoblanadi, qolaversa qismiy muvaffaqiyat
   * ham saqlanadi: 5 tadan 4 tasi yuklansa, oʻsha 4 tasi qoladi.
   */
  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return

    const room = MAX_LISTING_IMAGES - images.length
    if (room <= 0) {
      toast.error(fmt(t.maxReached, { max: MAX_LISTING_IMAGES }))
      return
    }
    const selected = list.slice(0, room)
    if (list.length > room) {
      toast.warning(fmt(t.partial, { room, max: MAX_LISTING_IMAGES }))
    }

    setUploading(true)
    setProgress({ done: 0, total: selected.length })

    const uploaded: ImageDraft[] = []
    let firstError: string | null = null

    for (const file of selected) {
      const formData = new FormData()
      formData.append('files', file)
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!response.ok) {
          // 413 da Vercel HTML qaytaradi — json() ni himoyalaymiz
          const data = await response.json().catch(() => null)
          firstError ??=
            (response.status === 413
              ? fmt(t.tooLarge, { name: file.name })
              : (data?.error ?? t.uploadFailed))
          continue
        }
        const data = (await response.json()) as { images: ImageDraft[] }
        uploaded.push(...data.images)
      } catch {
        firstError ??= t.network
      } finally {
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded])
      toast.success(plural(locale, uploaded.length, t.uploaded))
    }
    if (firstError) toast.error(firstError)

    setUploading(false)
    setProgress({ done: 0, total: 0 })
    if (inputRef.current) inputRef.current.value = ''
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  /** Sudrab tashlab tartiblash: `from` dagi rasm `to` o'rniga ko'chadi */
  const reorder = (from: number, to: number) => {
    if (from === to) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const makeCover = (index: number) => reorder(index, 0)

  const [dragIndex, setDragIndex] = React.useState<number | null>(null)
  const pick = () => inputRef.current?.click()
  const room = MAX_LISTING_IMAGES - images.length

  return (
    <div>
      <div
        onDragOver={(e) => {
          // Ichki tartiblash paytida yuklash zonasi yonmasin
          if (dragIndex !== null) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragIndex !== null) return
          e.preventDefault()
          setDragOver(false)
          void upload(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors',
          dragOver ? 'border-primary bg-primary-soft' : 'border-border-strong/70 bg-surface-2',
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          {uploading ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <CloudUpload className="size-7" />
          )}
        </span>
        <p className="mt-3 text-[15px] font-semibold text-text">
          {uploading ? fmt(t.uploading, { done: progress.done, total: progress.total }) : t.drop}
        </p>
        <p className="mt-1 text-[13px] text-muted">
          {fmt(t.formats, { mb: MAX_UPLOAD_MB, max: MAX_LISTING_IMAGES })}
          <br className="hidden sm:block" /> {t.coverNote}
        </p>
        <button
          type="button"
          onClick={pick}
          disabled={uploading || room <= 0}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          <ImagePlus className="size-4" /> {t.pick}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => e.target.files && void upload(e.target.files)}
        />
      </div>

      {images.length > 0 ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-2 text-[13px] text-muted">
            <span>{t.reorderHint}</span>
            <span className="tabular shrink-0 font-semibold text-text">
              {images.length} / {MAX_LISTING_IMAGES}
            </span>
          </div>
          <ul className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => (
              <li
                key={img.url}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(e) => {
                  if (dragIndex === null) return
                  e.preventDefault()
                }}
                onDrop={(e) => {
                  if (dragIndex === null) return
                  e.preventDefault()
                  e.stopPropagation()
                  reorder(dragIndex, i)
                  setDragIndex(null)
                }}
                className={cn(
                  'group relative cursor-grab overflow-hidden rounded-xl border bg-surface-2 active:cursor-grabbing',
                  i === 0 ? 'border-primary ring-1 ring-primary/40' : 'border-border',
                  dragIndex === i && 'opacity-40',
                )}
              >
                <span className="relative block aspect-[4/3]">
                  <Image
                    src={img.url}
                    alt={fmt(t.photoAlt, { n: i + 1 })}
                    fill
                    sizes="220px"
                    className="pointer-events-none object-cover"
                  />
                </span>

                {i === 0 ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-fg">
                    <Star className="size-3 fill-current" /> {t.cover}
                  </span>
                ) : (
                  <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={t.remove}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-surface/90 text-text shadow-sm transition-colors hover:bg-danger hover:text-white"
                >
                  <X className="size-4" />
                </button>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 pt-6">
                  <span className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={t.moveLeft}
                      className="rounded-md p-1 text-white/90 hover:bg-white/20 disabled:opacity-30"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1}
                      aria-label={t.moveRight}
                      className="rounded-md p-1 text-white/90 hover:bg-white/20 disabled:opacity-30"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </span>
                  {i !== 0 ? (
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
                    >
                      {t.makeCover}
                    </button>
                  ) : (
                    <GripVertical className="mr-1 size-4 text-white/80" aria-hidden />
                  )}
                </div>
              </li>
            ))}
            {room > 0 ? (
              <li>
                <button
                  type="button"
                  onClick={pick}
                  disabled={uploading}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-surface-2 text-center transition-colors hover:border-primary hover:bg-primary-soft disabled:opacity-60"
                >
                  <Plus className="size-6 text-primary" />
                  <span className="text-[13px] font-semibold text-text">{t.addMore}</span>
                  <span className="text-[11px] text-muted">{plural(locale, room, t.roomLeft)}</span>
                </button>
              </li>
            ) : null}
          </ul>
        </>
      ) : null}
    </div>
  )
}
