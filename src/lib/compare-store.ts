'use client'

import * as React from 'react'
import { MAX_COMPARE_ITEMS } from './constants'

export interface CompareItem {
  id: string
  slug: string
  title: string
  imageUrl: string | null
}

const STORAGE_KEY = 'arendator:compare'
const EMPTY: CompareItem[] = []

/**
 * Taqqoslash roʻyxati localStorage'da yashaydi — mehmon foydalanuvchi ham
 * roʻyxatdan oʻtmasdan avtomobillarni taqqoslay oladi.
 *
 * `useSyncExternalStore` ishlatilgan: React holatni tashqi manbadan (localStorage)
 * toʻgʻridan-toʻgʻri oʻqiydi. Bu effekt orqali sinxronlashdan koʻra toʻgʻriroq —
 * SSR mos keladi, boshqa tablar bilan sinxronizatsiya bepul keladi va
 * "cascading render" muammosi yoʻqoladi.
 */

let cache: CompareItem[] = EMPTY
let cacheRaw: string | null = null
const listeners = new Set<() => void>()

function parse(raw: string | null): CompareItem[] {
  if (!raw) return EMPTY
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY
    return parsed
      .filter(
        (i): i is CompareItem =>
          typeof i === 'object' &&
          i !== null &&
          typeof (i as CompareItem).id === 'string' &&
          typeof (i as CompareItem).slug === 'string',
      )
      .slice(0, MAX_COMPARE_ITEMS)
  } catch {
    return EMPTY
  }
}

function getSnapshot(): CompareItem[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  // Havola bir xil boʻlishi shart — aks holda useSyncExternalStore cheksiz qayta chizadi
  if (raw !== cacheRaw) {
    cacheRaw = raw
    cache = parse(raw)
  }
  return cache
}

function getServerSnapshot(): CompareItem[] {
  return EMPTY
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return
  emit()
}

function emit() {
  for (const listener of listeners) listener()
}

function write(next: CompareItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // kvota toʻlgan — jimgina oʻtkazib yuboramiz
  }
  emit()
}

export interface CompareApi {
  items: CompareItem[]
  count: number
  /** SSR'da va birinchi renderda `false` — UI "sakramasligi" uchun */
  isReady: boolean
  isFull: boolean
  has: (id: string) => boolean
  toggle: (item: CompareItem) => void
  remove: (id: string) => void
  clear: () => void
}

export function useCompare(): CompareApi {
  const items = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Gidratatsiyadan keyin haqiqiy roʻyxat koʻrsatiladi
  const isReady = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  return React.useMemo(() => {
    const ids = new Set(items.map((i) => i.id))
    return {
      items,
      count: items.length,
      isReady,
      isFull: items.length >= MAX_COMPARE_ITEMS,
      has: (id: string) => ids.has(id),
      toggle: (item: CompareItem) => {
        const current = getSnapshot()
        if (current.some((i) => i.id === item.id)) {
          write(current.filter((i) => i.id !== item.id))
        } else if (current.length < MAX_COMPARE_ITEMS) {
          write([...current, item])
        }
      },
      remove: (id: string) => write(getSnapshot().filter((i) => i.id !== id)),
      clear: () => write([]),
    }
  }, [items, isReady])
}
