import { z } from 'zod'

/** +998901234567 formatiga keltiradi */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 9) return `+998${digits}`
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`
  if (digits.length === 13 && digits.startsWith('998')) return `+${digits.slice(0, 12)}`
  return input.trim()
}

export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Telefon raqamini kiriting')
  .transform(normalizePhone)
  .refine((v) => /^\+998\d{9}$/.test(v), {
    message: 'Telefon raqami +998 XX XXX XX XX koʻrinishida boʻlishi kerak',
  })

export const passwordSchema = z
  .string()
  .min(8, 'Parol kamida 8 ta belgidan iborat boʻlsin')
  .max(72, 'Parol juda uzun') // bcrypt cheklovi
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), {
    message: 'Parolda kamida bitta harf va bitta raqam boʻlsin',
  })

export const cuidSchema = z.string().min(1, 'Notoʻgʻri identifikator')

/** Bo'sh string'ni undefined ga aylantiradi (form input'lar uchun) */
export const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional())

/** Form'dan kelgan string'ni songa aylantiradi */
export const numericString = (
  opts: { min?: number; max?: number; int?: boolean; label?: string } = {},
) => {
  const label = opts.label ?? 'Qiymat'
  let base = z.number({ message: `${label} son boʻlishi kerak` })
  if (opts.int) base = base.int(`${label} butun son boʻlishi kerak`)
  if (opts.min !== undefined)
    base = base.min(opts.min, `${label} kamida ${opts.min} boʻlsin`)
  if (opts.max !== undefined)
    base = base.max(opts.max, `${label} koʻpi bilan ${opts.max} boʻlsin`)

  return z.preprocess((v) => {
    if (typeof v === 'string') {
      const cleaned = v.replace(/[\s ]/g, '').replace(',', '.')
      if (cleaned === '') return undefined
      const n = Number(cleaned)
      return Number.isNaN(n) ? v : n
    }
    return v
  }, base)
}
