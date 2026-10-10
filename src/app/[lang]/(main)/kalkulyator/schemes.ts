import { computePlan, type ComputedPlan } from '@/lib/finance'

/**
 * Kalkulyatordagi uchta moliyalashtirish sxemasi.
 * Stavkalar — bozordagi odatiy oraliqqa yaqin TAXMINIY standart qiymatlar;
 * foydalanuvchi ularni o'zgartira oladi. Hech qaysi biri bank yoki
 * diler va'dasi emas.
 */
export type SchemeId = 'rassrochka' | 'lizing' | 'arenda'

/** Matnlar (nomi, afzalliklari…) lug'atda: messages.calculator.schemes[id] */
export interface SchemeDef {
  id: SchemeId
  index: number
  method: 'FLAT' | 'ANNUITY'
  defaultRate: number
  /** null — foydalanuvchi tanlagan boshlang'ich to'lov */
  fixedDownPercent: number | null
}

export const SCHEMES: SchemeDef[] = [
  {
    id: 'rassrochka',
    index: 1,
    method: 'FLAT',
    defaultRate: 10,
    fixedDownPercent: null,
  },
  {
    id: 'lizing',
    index: 2,
    method: 'ANNUITY',
    defaultRate: 24,
    fixedDownPercent: null,
  },
  {
    id: 'arenda',
    index: 3,
    method: 'ANNUITY',
    defaultRate: 30,
    fixedDownPercent: 10,
  },
]

export interface SchemeResult {
  def: SchemeDef
  rate: number
  down: number
  downPercent: number
  plan: ComputedPlan
}

export function computeScheme(
  def: SchemeDef,
  input: { price: number; downPercent: number; term: number; rate: number; precision: 0 | 2 },
): SchemeResult {
  const downPercent = def.fixedDownPercent ?? input.downPercent
  const down = Math.round((input.price * downPercent) / 100 * 10 ** input.precision) / 10 ** input.precision
  const plan = computePlan({
    carPrice: input.price,
    downPayment: Math.min(down, input.price - 1),
    termMonths: input.term,
    method: def.method,
    annualRatePercent: input.rate,
    precision: input.precision,
  })
  return { def, rate: input.rate, down, downPercent, plan }
}
