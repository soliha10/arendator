/**
 * Rassrochka / arenda to'lov grafigini hisoblash.
 *
 * Modul ataylab toza (pure): Prisma, React yoki Date-dan tashqari
 * hech narsaga bog'liq emas — shu sabab uni test qilish ham, klientda
 * jonli kalkulyator sifatida ishlatish ham mumkin.
 *
 * Pul hisob-kitobi float xatolarini oldini olish uchun butun songa
 * yaxlitlab olib boriladi (UZS uchun 0, USD uchun 2 kasr xona).
 */

export type CalcMethod = 'ANNUITY' | 'FLAT' | 'FIXED'
export type MoneyPrecision = 0 | 2

export interface ScheduleRow {
  /** 1 dan termMonths gacha */
  monthIndex: number
  dueDate: Date
  /** shu oyda to'lanadigan umumiy summa */
  amount: number
  /** shundan asosiy qarz qismi */
  principal: number
  /** shundan ustama (foiz) qismi */
  markup: number
  /** to'lovdan keyin qolgan asosiy qarz */
  balanceAfter: number
}

export interface ComputePlanInput {
  /** avtomobilning to'liq narxi */
  carPrice: number
  /** boshlang'ich to'lov */
  downPayment: number
  /** muddat, oyda */
  termMonths: number
  method: CalcMethod
  /** ANNUITY va FLAT uchun: yillik ustama foizi */
  annualRatePercent?: number
  /** FIXED uchun: arendator kiritgan oylik to'lov */
  monthlyPayment?: number
  /** har oyning nechinchi kunida to'lanadi (1..28) */
  paymentDay?: number
  /** shartnoma boshlanish sanasi; birinchi to'lov bundan 1 oy keyin */
  startDate?: Date
  precision?: MoneyPrecision
}

export interface ComputedPlan {
  /** moliyalashtiriladigan summa = narx - boshlang'ich to'lov */
  financedAmount: number
  /** o'rtacha/asosiy oylik to'lov */
  monthlyPayment: number
  /** jami to'lov = boshlang'ich + barcha oylik to'lovlar */
  totalPayable: number
  /** jami ustama (ortiqcha to'lov) */
  markupAmount: number
  /** samarali yillik foiz stavkasi */
  markupPercent: number
  /** ustamaning moliyalashtirilgan summaga nisbati, % */
  overpayPercent: number
  schedule: ScheduleRow[]
}

export interface YearSummary {
  year: number
  months: number
  total: number
  principal: number
  markup: number
  firstDueDate: Date
  lastDueDate: Date
}

const clampInt = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(n)))

/** Berilgan aniqlikda yaxlitlash (0.5 yuqoriga) */
export function roundMoney(value: number, precision: number = 0): number {
  const factor = 10 ** precision
  // Epsilon — 1.005 kabi holatlarda float xatosini tuzatadi
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** Oy qo'shish; oyning kunlari yetmasa oxirgi kunga tushadi (31 -> 30/28) */
export function addMonths(date: Date, months: number, dayOfMonth?: number): Date {
  const d = new Date(date.getTime())
  const targetDay = dayOfMonth ?? d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(targetDay, daysInMonth))
  d.setHours(12, 0, 0, 0) // vaqt mintaqasi siljishidan himoya
  return d
}

/**
 * Annuitet oylik to'lovi.
 * pmt = P * r / (1 - (1 + r)^-n)
 */
export function annuityPayment(
  principal: number,
  annualRatePercent: number,
  months: number,
): number {
  if (months <= 0) return 0
  const r = annualRatePercent / 100 / 12
  if (r <= 0) return principal / months
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

/**
 * Oylik to'lov ma'lum bo'lganda samarali yillik foizni topish (IRR).
 * Bisection — barqaror va tashqi kutubxonasiz.
 */
export function impliedAnnualRate(
  principal: number,
  monthlyPayment: number,
  months: number,
): number {
  if (principal <= 0 || months <= 0) return 0
  const total = monthlyPayment * months
  if (total <= principal) return 0 // ustama yo'q yoki chegirma

  let lo = 0
  let hi = 500 // 500% yillik — real hayotdagi har qanday holatni qoplaydi
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const pmt = annuityPayment(principal, mid, months)
    if (pmt > monthlyPayment) hi = mid
    else lo = mid
    if (hi - lo < 1e-7) break
  }
  return roundMoney((lo + hi) / 2, 2)
}

/**
 * To'liq hisob-kitob: oylik to'lov, jami summa, ustama va oyma-oy grafik.
 *
 * Yaxlitlash strategiyasi: har oy alohida yaxlitlanadi, oxirgi oy esa
 * qoldiqni to'liq yopadi — shu sabab grafik yig'indisi doim jami summaga
 * teng chiqadi (1-2 so'mlik "dumcha" qolmaydi).
 */
export function computePlan(input: ComputePlanInput): ComputedPlan {
  const precision: MoneyPrecision = input.precision ?? 0
  const termMonths = clampInt(input.termMonths, 1, 120)
  const paymentDay = clampInt(input.paymentDay ?? 5, 1, 28)
  const startDate = input.startDate ?? new Date()

  const carPrice = Math.max(0, input.carPrice)
  const downPayment = Math.min(Math.max(0, input.downPayment), carPrice)
  const financedAmount = roundMoney(carPrice - downPayment, precision)

  // 1-qadam: usulga qarab oylik to'lov va samarali foizni aniqlaymiz
  let rate = Math.max(0, input.annualRatePercent ?? 0)
  let basePayment: number
  let flatMarkupTotal: number | null = null

  switch (input.method) {
    case 'FLAT': {
      // Ustama butun summaga: markup = P * r * (n / 12)
      flatMarkupTotal = roundMoney(
        financedAmount * (rate / 100) * (termMonths / 12),
        precision,
      )
      basePayment = (financedAmount + flatMarkupTotal) / termMonths
      break
    }
    case 'FIXED': {
      basePayment = Math.max(0, input.monthlyPayment ?? 0)
      const total = basePayment * termMonths
      if (total <= financedAmount) {
        // Ustama yo'q — teng bo'lib to'lanadi
        flatMarkupTotal = roundMoney(total - financedAmount, precision)
        rate = 0
      } else {
        rate = impliedAnnualRate(financedAmount, basePayment, termMonths)
      }
      break
    }
    case 'ANNUITY':
    default: {
      basePayment = annuityPayment(financedAmount, rate, termMonths)
      break
    }
  }

  const monthlyPayment = roundMoney(basePayment, precision)

  // 2-qadam: grafikni qatorma-qator quramiz
  const schedule: ScheduleRow[] = []
  let balance = financedAmount

  const useFlatSplit = flatMarkupTotal !== null
  const flatPrincipalPart = useFlatSplit
    ? roundMoney(financedAmount / termMonths, precision)
    : 0
  const flatMarkupPart = useFlatSplit
    ? roundMoney((flatMarkupTotal as number) / termMonths, precision)
    : 0

  let markupPaid = 0

  for (let i = 1; i <= termMonths; i++) {
    const isLast = i === termMonths
    let principalPart: number
    let markupPart: number

    if (useFlatSplit) {
      principalPart = isLast ? balance : flatPrincipalPart
      markupPart = isLast
        ? roundMoney((flatMarkupTotal as number) - markupPaid, precision)
        : flatMarkupPart
    } else {
      const monthlyRate = rate / 100 / 12
      markupPart = roundMoney(balance * monthlyRate, precision)
      principalPart = isLast
        ? balance
        : roundMoney(monthlyPayment - markupPart, precision)
      // Himoya: to'lov foizni ham qoplamasa, qarz o'smasligi uchun
      if (principalPart < 0) principalPart = 0
      if (principalPart > balance) principalPart = balance
    }

    markupPaid = roundMoney(markupPaid + markupPart, precision)
    const amount = roundMoney(principalPart + markupPart, precision)
    balance = roundMoney(balance - principalPart, precision)

    schedule.push({
      monthIndex: i,
      dueDate: addMonths(startDate, i, paymentDay),
      amount,
      principal: principalPart,
      markup: markupPart,
      balanceAfter: balance < 0 ? 0 : balance,
    })
  }

  const paymentsTotal = roundMoney(
    schedule.reduce((sum, row) => sum + row.amount, 0),
    precision,
  )
  const markupAmount = roundMoney(paymentsTotal - financedAmount, precision)
  const totalPayable = roundMoney(downPayment + paymentsTotal, precision)

  return {
    financedAmount,
    monthlyPayment,
    totalPayable,
    markupAmount,
    markupPercent:
      input.method === 'FLAT' ? roundMoney(rate, 2) : roundMoney(rate, 2),
    overpayPercent:
      financedAmount > 0
        ? roundMoney((markupAmount / financedAmount) * 100, 2)
        : 0,
    schedule,
  }
}

/** Grafikni yillar bo'yicha guruhlash — "yillik grafik" ko'rinishi uchun */
export function summarizeByYear(schedule: ScheduleRow[]): YearSummary[] {
  const map = new Map<number, YearSummary>()

  for (const row of schedule) {
    const year = row.dueDate.getFullYear()
    const existing = map.get(year)
    if (existing) {
      existing.months += 1
      existing.total = roundMoney(existing.total + row.amount, 2)
      existing.principal = roundMoney(existing.principal + row.principal, 2)
      existing.markup = roundMoney(existing.markup + row.markup, 2)
      existing.lastDueDate = row.dueDate
    } else {
      map.set(year, {
        year,
        months: 1,
        total: row.amount,
        principal: row.principal,
        markup: row.markup,
        firstDueDate: row.dueDate,
        lastDueDate: row.dueDate,
      })
    }
  }

  return [...map.values()].sort((a, b) => a.year - b.year)
}

/** Boshlang'ich to'lovning narxga nisbati, % */
export function downPaymentPercent(carPrice: number, downPayment: number): number {
  if (carPrice <= 0) return 0
  return roundMoney((downPayment / carPrice) * 100, 1)
}
