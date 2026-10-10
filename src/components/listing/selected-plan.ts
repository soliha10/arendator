'use client'

import * as React from 'react'

/**
 * E'lon sahifasida tanlangan to'lov sharti.
 *
 * Moliyalashtirish vidjeti o'ng ustunda, amortizatsiya grafigi va ariza
 * formasi esa boshqa joyda — ular bitta server sahifasida alohida orolchalar
 * (client island) bo'lib turadi. Umumiy context provider qo'yish uchun
 * butun sahifani klientga o'tkazish kerak bo'lardi; kichik tashqi store
 * yetarli.
 */
type Listener = () => void

let selected: string | null = null
const listeners = new Set<Listener>()

export function selectPlan(id: string | null) {
  if (selected === id) return
  selected = id
  for (const l of listeners) l()
}

function subscribe(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** `fallback` — hali hech narsa tanlanmagan bo'lsa (asosiy shart) */
export function useSelectedPlan(fallback: string | null): string | null {
  const value = React.useSyncExternalStore(
    subscribe,
    () => selected,
    () => null,
  )
  return value ?? fallback
}

/** Ariza formasiga o'tish va shartni oldindan tanlash */
export function goToLeadForm(planId: string | null) {
  if (planId) selectPlan(planId)
  const el = document.getElementById('ariza')
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.querySelector<HTMLInputElement>('input[name="fullName"]')?.focus({ preventScroll: true })
}
