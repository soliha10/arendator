/**
 * Reklama va analitika hodisalari — bitta funksiya orqali.
 * Qaysi tizim ulangan bo'lsa (GA4, Yandex Metrika, Meta Pixel), hodisa
 * o'shanga yuboriladi; hech biri yo'q bo'lsa — jim o'tadi.
 *
 * Konversiyalar reklama kampaniyalarini optimallashtirish uchun kerak:
 * qaysi e'lon "qo'ng'iroq" yoki "ariza" olib keldi — shu raqamlar bilan
 * reklama byudjeti taqsimlanadi.
 */
/** ID'lar skript matniga qo'yiladi — faqat kutilgan formatdagisi o'tadi */
const safe = (value: string | undefined, pattern: RegExp) =>
  value && pattern.test(value) ? value : ''

export const ANALYTICS = {
  gaId: safe(process.env.NEXT_PUBLIC_GA_ID, /^G-[A-Z0-9]{4,20}$/),
  ymId: safe(process.env.NEXT_PUBLIC_YM_ID, /^\d{5,12}$/),
  metaPixelId: safe(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d{10,20}$/),
}

export type TrackEvent =
  | 'phone_reveal' // "Qo'ng'iroq" / raqamni ko'rsatish
  | 'lead_submit' // ariza yuborildi
  | 'telegram_click'
  | 'listing_publish' // e'lon chop etishga yuborildi
  | 'sign_up'
  | 'search_save'
  | 'calculator_use'

/** Meta Pixel'dagi standart hodisa nomlari — reklama optimizatsiyasi shularni taniydi */
const META_EVENT: Partial<Record<TrackEvent, string>> = {
  phone_reveal: 'Contact',
  lead_submit: 'Lead',
  sign_up: 'CompleteRegistration',
  listing_publish: 'SubmitApplication',
  search_save: 'Search',
}

type AnyFn = (...args: unknown[]) => void
declare global {
  interface Window {
    gtag?: AnyFn
    ym?: AnyFn
    fbq?: AnyFn
  }
}

export function track(event: TrackEvent, params: Record<string, string | number | undefined> = {}) {
  if (typeof window === 'undefined') return
  try {
    window.gtag?.('event', event, params)
    if (ANALYTICS.ymId) window.ym?.(Number(ANALYTICS.ymId), 'reachGoal', event, params)
    const metaName = META_EVENT[event]
    if (metaName) window.fbq?.('track', metaName, params)
    else window.fbq?.('trackCustom', event, params)
  } catch {
    // Analitika hech qachon sahifani buzmasligi kerak
  }
}
