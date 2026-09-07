'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { MAX_LISTING_IMAGES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ImageDraft } from './types'

export function ImageUploader({
  images,
  onChange,
}: {
  images: ImageDraft[]
  onChange: (images: ImageDraft[]) => void
}) {
  const [uploading, setUploading] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return

    const room = MAX_LISTING_IMAGES - images.length
    if (room <= 0) {
      toast.error(`Koʻpi bilan ${MAX_LISTING_IMAGES} ta rasm yuklash mumkin`)
      return
    }
    const selected = list.slice(0, room)
    if (list.length > room) {
      toast.warning(`Faqat ${room} ta rasm qoʻshildi — limit ${MAX_LISTING_IMAGES} ta`)
    }

    const formData = new FormData()
    for (const file of selected) formData.append('files', file)

    setUploading(true)
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error ?? 'Rasmni yuklab boʻlmadi')
        return
      }
      onChange([...images, ...data.images])
      toast.success(`${data.images.length} ta rasm yuklandi`)
    } catch {
      toast.error('Tarmoq xatosi. Qayta urinib koʻring.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const makeCover = (index: number) => {
    if (index === 0) return
    const next = [...images]
    const [item] = next.splice(index, 1)
    onChange([item, ...next])
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void upload(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver ? 'border-primary bg-primary-soft' : 'border-border-strong',
        )}
      >
        {uploading ? (
          <Loader2 className="size-8 animate-spin text-primary" />
        ) : (
          <ImagePlus className="size-8 text-subtle" />
        )}
        <p className="mt-3 text-sm font-medium text-text">
          {uploading ? 'Yuklanmoqda…' : 'Rasmlarni bu yerga tashlang'}
        </p>
        <p className="mt-1 text-[13px] text-muted">
          JPG, PNG yoki WebP · koʻpi bilan {MAX_LISTING_IMAGES} ta · har biri 8 MB gacha
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] border border-border-strong bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-2 disabled:opacity-60"
        >
          <Upload className="size-4" /> Fayl tanlash
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
          <p className="mt-4 text-[13px] text-muted">
            Birinchi rasm muqova boʻladi. Tartibni oʻzgartirish uchun oʻqlardan
            foydalaning.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => (
              <li
                key={img.url}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface-2"
              >
                <span className="relative block aspect-[16/10]">
                  <Image
                    src={img.url}
                    alt={`${i + 1}-rasm`}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </span>

                {i === 0 ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-fg">
                    <Star className="size-2.5 fill-current" /> Muqova
                  </span>
                ) : null}

                <div className="flex items-center justify-between gap-1 border-t border-border bg-surface p-1.5">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Chapga surish"
                      className="rounded-md p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-30"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1}
                      aria-label="Oʻngga surish"
                      className="rounded-md p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-30"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                  <div className="flex gap-0.5">
                    {i !== 0 ? (
                      <button
                        type="button"
                        onClick={() => makeCover(i)}
                        aria-label="Muqova qilish"
                        title="Muqova qilish"
                        className="rounded-md p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-primary"
                      >
                        <Star className="size-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label="Oʻchirish"
                      className="rounded-md p-1 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
