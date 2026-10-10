import type { Locale } from './config'

/**
 * Tarjima satrlariga qiymat qo'yish: fmt('{n} ta eʼlon', { n: 5 }).
 * Satrlar oddiy string bo'lib qoladi — Client Component'larga uzatish mumkin.
 */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) =>
    key in vars ? String(vars[key]) : m,
  )
}

/**
 * Ko'plik shakllari. Ruschada 1 / 2-4 / 5+ farqlanadi, o'zbekcha va
 * inglizchada ikki shakl yetarli. `{n}` avtomatik qo'yiladi.
 *   plural('ru', 3, { one: '{n} объявление', few: '{n} объявления', many: '{n} объявлений' })
 */
export interface PluralForms {
  one: string
  few?: string
  many?: string
  other?: string
}

const rules: Partial<Record<Locale, Intl.PluralRules>> = {}

export function plural(locale: Locale, n: number, forms: PluralForms): string {
  const pr = (rules[locale] ??= new Intl.PluralRules(locale === 'uz' ? 'en' : locale))
  const cat = pr.select(n)
  const template =
    (cat === 'one' && forms.one) ||
    (cat === 'few' && forms.few) ||
    (cat === 'many' && forms.many) ||
    forms.other ||
    forms.many ||
    forms.few ||
    forms.one
  return fmt(template, { n })
}
