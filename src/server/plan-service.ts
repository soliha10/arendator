import type { Prisma, PrismaClient } from '@prisma/client'
import { computePlan, type CalcMethod } from '@/lib/finance'
import { CURRENCY_PRECISION } from '@/lib/constants'
import { toUzs, type Rates } from './exchange'
import type { PlanOutput } from '@/lib/validation/listing'

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Bitta to'lov shartini hisoblab, bazaga yozadi va oyma-oy grafikni
 * generatsiya qiladi. Hisob-kitob bitta joyda — form, seed va API
 * bir xil natija beradi.
 */
export async function createPlanWithSchedule(
  db: Db,
  listingId: string,
  input: PlanOutput,
  rates: Rates,
): Promise<{ id: string; monthlyPaymentUzs: number; downPaymentUzs: number; carPriceUzs: number }> {
  const precision = CURRENCY_PRECISION[input.currency]
  const startDate = input.startDate ?? new Date()

  const computed = computePlan({
    carPrice: input.carPrice,
    downPayment: input.downPayment,
    termMonths: input.termMonths,
    method: input.calcMethod as CalcMethod,
    annualRatePercent: input.annualRatePercent,
    monthlyPayment: input.monthlyPaymentInput,
    paymentDay: input.paymentDay,
    startDate,
    precision,
  })

  const carPriceUzs = toUzs(input.carPrice, input.currency, rates)
  const downPaymentUzs = toUzs(input.downPayment, input.currency, rates)
  const monthlyPaymentUzs = toUzs(computed.monthlyPayment, input.currency, rates)

  const plan = await db.rentalPlan.create({
    data: {
      listingId,
      name: input.name,
      planType: input.planType,
      currency: input.currency,
      calcMethod: input.calcMethod,

      carPrice: input.carPrice,
      downPayment: input.downPayment,
      termMonths: input.termMonths,
      monthlyPayment: computed.monthlyPayment,
      totalPayable: computed.totalPayable,
      markupAmount: computed.markupAmount,
      markupPercent: computed.markupPercent,

      carPriceUzs,
      downPaymentUzs,
      monthlyPaymentUzs,

      paymentDay: input.paymentDay,
      startDate,

      depositAmount: input.depositAmount ?? null,
      dailyPayment: input.planType === 'RENT' ? (input.dailyPayment ?? null) : null,
      insuranceIncluded: input.insuranceIncluded,
      cascoIncluded: input.cascoIncluded,
      maintenanceIncluded: input.maintenanceIncluded,
      mileageLimitPerYear: input.mileageLimitPerYear ?? null,
      extraMileageFee: input.extraMileageFee ?? null,
      ownershipTransfer: input.ownershipTransfer,
      earlyPayoffAllowed: input.earlyPayoffAllowed,
      penaltyPerDay: input.penaltyPerDay ?? null,
      requiredDocuments: input.requiredDocuments ?? null,
      notes: input.notes ?? null,
      isDefault: input.isDefault,

      schedule: {
        createMany: {
          data: computed.schedule.map((row) => ({
            monthIndex: row.monthIndex,
            dueDate: row.dueDate,
            amount: row.amount,
            principal: row.principal,
            markup: row.markup,
            balanceAfter: row.balanceAfter,
          })),
        },
      },
    },
    select: { id: true },
  })

  return { id: plan.id, monthlyPaymentUzs, downPaymentUzs, carPriceUzs }
}

/**
 * Mavjud shartni yangilaydi va grafikni qaytadan quradi.
 * Arendator qo'lda tahrirlagan qatorlar ham qayta hisoblanadi —
 * chunki asosiy parametrlar o'zgargan bo'lishi mumkin.
 */
export async function updatePlanWithSchedule(
  db: Db,
  planId: string,
  input: PlanOutput,
  rates: Rates,
): Promise<void> {
  const precision = CURRENCY_PRECISION[input.currency]
  const startDate = input.startDate ?? new Date()

  const computed = computePlan({
    carPrice: input.carPrice,
    downPayment: input.downPayment,
    termMonths: input.termMonths,
    method: input.calcMethod as CalcMethod,
    annualRatePercent: input.annualRatePercent,
    monthlyPayment: input.monthlyPaymentInput,
    paymentDay: input.paymentDay,
    startDate,
    precision,
  })

  const carPriceUzs = toUzs(input.carPrice, input.currency, rates)
  const downPaymentUzs = toUzs(input.downPayment, input.currency, rates)
  const monthlyPaymentUzs = toUzs(computed.monthlyPayment, input.currency, rates)

  await db.scheduleItem.deleteMany({ where: { planId } })

  await db.rentalPlan.update({
    where: { id: planId },
    data: {
      name: input.name,
      planType: input.planType,
      currency: input.currency,
      calcMethod: input.calcMethod,

      carPrice: input.carPrice,
      downPayment: input.downPayment,
      termMonths: input.termMonths,
      monthlyPayment: computed.monthlyPayment,
      totalPayable: computed.totalPayable,
      markupAmount: computed.markupAmount,
      markupPercent: computed.markupPercent,

      carPriceUzs,
      downPaymentUzs,
      monthlyPaymentUzs,

      paymentDay: input.paymentDay,
      startDate,

      depositAmount: input.depositAmount ?? null,
      dailyPayment: input.planType === 'RENT' ? (input.dailyPayment ?? null) : null,
      insuranceIncluded: input.insuranceIncluded,
      cascoIncluded: input.cascoIncluded,
      maintenanceIncluded: input.maintenanceIncluded,
      mileageLimitPerYear: input.mileageLimitPerYear ?? null,
      extraMileageFee: input.extraMileageFee ?? null,
      ownershipTransfer: input.ownershipTransfer,
      earlyPayoffAllowed: input.earlyPayoffAllowed,
      penaltyPerDay: input.penaltyPerDay ?? null,
      requiredDocuments: input.requiredDocuments ?? null,
      notes: input.notes ?? null,
      isDefault: input.isDefault,

      schedule: {
        createMany: {
          data: computed.schedule.map((row) => ({
            monthIndex: row.monthIndex,
            dueDate: row.dueDate,
            amount: row.amount,
            principal: row.principal,
            markup: row.markup,
            balanceAfter: row.balanceAfter,
          })),
        },
      },
    },
  })
}

/**
 * E'lon shartlarini kiritilgan ro'yxat bilan sinxronlaydi:
 * mavjudlari yangilanadi, yangilari qo'shiladi, ro'yxatda yo'qlari o'chiriladi.
 */
export async function syncPlans(
  db: Db,
  listingId: string,
  plans: PlanOutput[],
  rates: Rates,
): Promise<void> {
  const existing = await db.rentalPlan.findMany({
    where: { listingId },
    select: { id: true },
  })
  const existingIds = new Set(existing.map((p) => p.id))
  const keptIds = new Set(
    plans.map((p) => p.id).filter((id): id is string => !!id && existingIds.has(id)),
  )

  const removed = [...existingIds].filter((id) => !keptIds.has(id))
  if (removed.length > 0) {
    await db.rentalPlan.deleteMany({ where: { id: { in: removed } } })
  }

  // Faqat bitta shart "asosiy" bo'lishi mumkin
  const hasDefault = plans.some((p) => p.isDefault)
  const normalized = plans.map((p, i) => ({
    ...p,
    isDefault: hasDefault ? p.isDefault : i === 0,
  }))

  for (const plan of normalized) {
    if (plan.id && existingIds.has(plan.id)) {
      await updatePlanWithSchedule(db, plan.id, plan, rates)
    } else {
      await createPlanWithSchedule(db, listingId, plan, rates)
    }
  }
}

/**
 * E'londagi barcha shartlar asosida denormalizatsiya qilingan
 * ustunlarni yangilaydi — katalog filtrlari shu ustunlarda ishlaydi.
 */
export async function recalcListingAggregates(
  db: Db,
  listingId: string,
  rates: Rates,
): Promise<void> {
  const [plans, listing] = await Promise.all([
    db.rentalPlan.findMany({
      where: { listingId },
      select: {
        monthlyPaymentUzs: true,
        downPaymentUzs: true,
        carPriceUzs: true,
        termMonths: true,
        planType: true,
        dailyPayment: true,
        currency: true,
      },
    }),
    db.listing.findUniqueOrThrow({
      where: { id: listingId },
      select: { hasCashSale: true, cashPrice: true, cashCurrency: true },
    }),
  ])

  const cashPriceUzs =
    listing.hasCashSale && listing.cashPrice
      ? toUzs(Number(listing.cashPrice), listing.cashCurrency, rates)
      : null
  const dailies = plans
    .filter((p) => p.planType === 'RENT' && p.dailyPayment)
    .map((p) => toUzs(Number(p.dailyPayment), p.currency, rates))

  if (plans.length === 0) {
    await db.listing.update({
      where: { id: listingId },
      data: {
        minMonthlyPaymentUzs: null,
        minDownPaymentUzs: null,
        carPriceUzs: cashPriceUzs,
        cashPriceUzs,
        minDailyRentUzs: null,
        minTermMonths: null,
        maxTermMonths: null,
        hasInstallment: false,
        hasRent: false,
      },
    })
    return
  }

  const monthly = plans.map((p) => Number(p.monthlyPaymentUzs))
  const down = plans.map((p) => Number(p.downPaymentUzs))
  const price = plans.map((p) => Number(p.carPriceUzs))
  const terms = plans.map((p) => p.termMonths)

  await db.listing.update({
    where: { id: listingId },
    data: {
      minMonthlyPaymentUzs: Math.min(...monthly),
      minDownPaymentUzs: Math.min(...down),
      // Narx filtri naqd narx bo'yicha ishlaydi, u bo'lmasa — shartlardagi narx
      carPriceUzs: cashPriceUzs ?? Math.max(...price),
      cashPriceUzs,
      minDailyRentUzs: dailies.length ? Math.min(...dailies) : null,
      minTermMonths: Math.min(...terms),
      maxTermMonths: Math.max(...terms),
      hasInstallment: plans.some(
        (p) => p.planType === 'INSTALLMENT' || p.planType === 'LEASING',
      ),
      hasRent: plans.some((p) => p.planType === 'RENT'),
    },
  })
}

/** Arendator profilidagi e'lonlar sonini yangilaydi */
export async function recalcProfileCounters(
  db: Db,
  userId: string,
): Promise<void> {
  const profile = await db.arendatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!profile) return

  const listingCount = await db.listing.count({
    where: { ownerId: userId, status: 'ACTIVE' },
  })

  await db.arendatorProfile.update({
    where: { id: profile.id },
    data: { listingCount },
  })
}
