import type { Currency, Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type Rates = Record<Currency, number>

export const DEFAULT_RATES: Rates = { UZS: 1, USD: 12_800 }

type Db = PrismaClient | Prisma.TransactionClient

/** Valyuta kurslarini bazadan oladi; topilmasa standart qiymat ishlatiladi */
export async function getRates(db: Db = prisma): Promise<Rates> {
  const rows = await db.exchangeRate.findMany()
  const rates: Rates = { ...DEFAULT_RATES }
  for (const row of rows) {
    const value = Number(row.rateToUzs)
    if (value > 0) rates[row.currency] = value
  }
  return rates
}

/** Istalgan valyutadagi summani so'mga o'giradi */
export function toUzs(amount: number, currency: Currency, rates: Rates): number {
  return Math.round(amount * (rates[currency] ?? 1))
}
