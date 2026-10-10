import type { Messages } from './messages'

/** Viloyat nomi joriy tilda; lug'atda bo'lmasa — bazadagi nom */
export function regionLabel(m: Messages, slug: string | null | undefined, fallback: string): string {
  return (slug && m.enums.region[slug]) || fallback
}

/** Qulaylik nomi; noma'lum kalit bo'lsa — kalitning o'zi */
export function featureLabel(m: Messages, key: string): string {
  return (m.enums.feature as Record<string, string>)[key] ?? key
}
