import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  addMonths,
  annuityPayment,
  computePlan,
  downPaymentPercent,
  impliedAnnualRate,
  roundMoney,
  summarizeByYear,
} from '../finance'

const START = new Date(2026, 8, 7) // 2026-09-07

/**
 * Grafikning ichki izchilligini tekshiradi:
 * asosiy qarz toʻliq yopiladi, qoldiq 0 ga tushadi,
 * har bir qatorda toʻlov = asosiy + ustama, qoldiq faqat kamayadi.
 */
function assertScheduleConsistent(
  result: ReturnType<typeof computePlan>,
  financed: number,
  precision = 0,
) {
  const r = (n: number) => roundMoney(n, precision)
  const principalPaid = result.schedule.reduce((s, row) => s + row.principal, 0)
  const paid = result.schedule.reduce((s, row) => s + row.amount, 0)

  assert.equal(r(principalPaid), r(financed), 'asosiy qarz toʻliq yopilishi kerak')
  assert.equal(
    result.schedule.at(-1)?.balanceAfter,
    0,
    'oxirgi oydan keyin qoldiq 0 boʻlishi kerak',
  )
  assert.equal(
    r(paid),
    r(result.financedAmount + result.markupAmount),
    'toʻlovlar yigʻindisi = qarz + ustama',
  )

  for (const row of result.schedule) {
    assert.equal(
      r(row.principal + row.markup),
      row.amount,
      `${row.monthIndex}-oy: toʻlov qismlari mos kelmadi`,
    )
  }

  let prev = Infinity
  for (const row of result.schedule) {
    assert.ok(row.balanceAfter <= prev, 'qoldiq oshib ketdi')
    prev = row.balanceAfter
  }
}

describe('roundMoney', () => {
  it('butun songa yaxlitlaydi', () => {
    assert.equal(roundMoney(1234.4), 1234)
    assert.equal(roundMoney(1234.5), 1235)
  })

  it('float xatosini tuzatadi', () => {
    assert.equal(roundMoney(1.005, 2), 1.01)
    assert.equal(roundMoney(0.1 + 0.2, 2), 0.3)
  })
})

describe('addMonths', () => {
  it('oy qoʻshadi va kunni saqlaydi', () => {
    const d = addMonths(new Date(2026, 0, 15), 2, 15)
    assert.equal(d.getMonth(), 2) // mart
    assert.equal(d.getDate(), 15)
  })

  it('oyda kun yetmasa oxirgi kunga tushadi', () => {
    const d = addMonths(new Date(2026, 0, 31), 1, 31)
    assert.equal(d.getMonth(), 1) // fevral
    assert.equal(d.getDate(), 28) // 2026 kabisa yil emas
  })

  it('yil chegarasidan oʻtadi', () => {
    const d = addMonths(new Date(2026, 11, 5), 2, 5)
    assert.equal(d.getFullYear(), 2027)
    assert.equal(d.getMonth(), 1)
  })
})

describe('annuityPayment', () => {
  it('0% da summani teng boʻladi', () => {
    assert.equal(annuityPayment(120_000, 0, 12), 10_000)
  })

  it('klassik annuitet formulasiga mos keladi', () => {
    // 100 000, 12% yillik, 12 oy -> ~8 884.88
    const pmt = annuityPayment(100_000, 12, 12)
    assert.ok(Math.abs(pmt - 8884.88) < 0.5, `kutilmagan qiymat: ${pmt}`)
  })
})

describe('impliedAnnualRate', () => {
  it('annuitetning teskarisini topadi', () => {
    const pmt = annuityPayment(100_000_000, 24, 24)
    const rate = impliedAnnualRate(100_000_000, pmt, 24)
    assert.ok(Math.abs(rate - 24) < 0.05, `kutilmagan stavka: ${rate}`)
  })

  it('ustama boʻlmasa 0 qaytaradi', () => {
    assert.equal(impliedAnnualRate(120_000, 10_000, 12), 0)
    assert.equal(impliedAnnualRate(120_000, 9_000, 12), 0) // chegirma
  })
})

describe('computePlan — ANNUITY', () => {
  const input = {
    carPrice: 180_000_000,
    downPayment: 54_000_000,
    termMonths: 24,
    method: 'ANNUITY' as const,
    annualRatePercent: 24,
    paymentDay: 5,
    startDate: START,
  }

  it('toʻgʻri oylik toʻlov va grafik beradi', () => {
    const r = computePlan(input)
    assert.equal(r.financedAmount, 126_000_000)
    assert.equal(r.schedule.length, 24)
    assert.ok(r.monthlyPayment > 6_000_000 && r.monthlyPayment < 7_000_000)
    assertScheduleConsistent(r, 126_000_000)
  })

  it('ustama muddat bilan oshadi', () => {
    const short = computePlan({ ...input, termMonths: 12 })
    const long = computePlan({ ...input, termMonths: 36 })
    assert.ok(long.markupAmount > short.markupAmount)
    assert.ok(long.monthlyPayment < short.monthlyPayment)
  })

  it('0% da ustama boʻlmaydi', () => {
    const r = computePlan({ ...input, annualRatePercent: 0 })
    assert.equal(r.markupAmount, 0)
    assert.equal(r.monthlyPayment, 126_000_000 / 24)
    assertScheduleConsistent(r, 126_000_000)
  })

  it('birinchi toʻlov boshlanish sanasidan bir oy keyin', () => {
    const r = computePlan(input)
    const first = r.schedule[0].dueDate
    assert.equal(first.getMonth(), 9) // oktabr
    assert.equal(first.getDate(), 5)
  })
})

describe('computePlan — FLAT', () => {
  it('ustamani butun summaga hisoblaydi', () => {
    const r = computePlan({
      carPrice: 100_000_000,
      downPayment: 0,
      termMonths: 24,
      method: 'FLAT',
      annualRatePercent: 20,
      startDate: START,
    })
    // 100 mln * 20% * 2 yil = 40 mln ustama
    assert.equal(r.markupAmount, 40_000_000)
    assert.equal(r.monthlyPayment, roundMoney(140_000_000 / 24))
    assertScheduleConsistent(r, 100_000_000)
  })

  it('FLAT annuitetdan qimmatroq chiqadi', () => {
    const base = {
      carPrice: 100_000_000,
      downPayment: 0,
      termMonths: 24,
      annualRatePercent: 20,
      startDate: START,
    }
    const flat = computePlan({ ...base, method: 'FLAT' })
    const annuity = computePlan({ ...base, method: 'ANNUITY' })
    assert.ok(flat.markupAmount > annuity.markupAmount)
  })
})

describe('computePlan — FIXED', () => {
  it('samarali yillik foizni teskari hisoblaydi', () => {
    const r = computePlan({
      carPrice: 180_000_000,
      downPayment: 54_000_000,
      termMonths: 24,
      method: 'FIXED',
      monthlyPayment: 6_500_000,
      startDate: START,
    })
    assert.equal(r.monthlyPayment, 6_500_000)
    assert.ok(r.markupPercent > 20 && r.markupPercent < 23, `stavka: ${r.markupPercent}`)
    assertScheduleConsistent(r, 126_000_000)
  })

  it('ustamasiz (toʻlovlar yigʻindisi = qarz) holatni qoʻllab-quvvatlaydi', () => {
    const r = computePlan({
      carPrice: 120_000_000,
      downPayment: 0,
      termMonths: 12,
      method: 'FIXED',
      monthlyPayment: 10_000_000,
      startDate: START,
    })
    assert.equal(r.markupAmount, 0)
    assert.equal(r.markupPercent, 0)
    assertScheduleConsistent(r, 120_000_000)
  })
})

describe('computePlan — chegara holatlari', () => {
  it('boshlangʻich toʻlov narxdan oshsa, narx bilan cheklanadi', () => {
    const r = computePlan({
      carPrice: 100_000_000,
      downPayment: 150_000_000,
      termMonths: 12,
      method: 'ANNUITY',
      annualRatePercent: 20,
    })
    assert.equal(r.financedAmount, 0)
    assert.equal(r.monthlyPayment, 0)
  })

  it('muddat 120 oydan oshmaydi', () => {
    const r = computePlan({
      carPrice: 100_000_000,
      downPayment: 0,
      termMonths: 500,
      method: 'ANNUITY',
      annualRatePercent: 10,
    })
    assert.equal(r.schedule.length, 120)
  })

  it('toʻlov kuni 1..28 oraligʻiga keltiriladi', () => {
    const r = computePlan({
      carPrice: 100_000_000,
      downPayment: 0,
      termMonths: 3,
      method: 'ANNUITY',
      annualRatePercent: 0,
      paymentDay: 31,
      startDate: START,
    })
    for (const row of r.schedule) assert.ok(row.dueDate.getDate() <= 28)
  })

  it('USD uchun 2 kasr xona bilan ishlaydi', () => {
    const r = computePlan({
      carPrice: 15_000,
      downPayment: 5_000,
      termMonths: 12,
      method: 'ANNUITY',
      annualRatePercent: 18,
      precision: 2,
      startDate: START,
    })
    assertScheduleConsistent(r, 10_000, 2)
    assert.ok(r.monthlyPayment > 900 && r.monthlyPayment < 930)
  })
})

describe('summarizeByYear', () => {
  it('grafikni yillar boʻyicha guruhlaydi', () => {
    const r = computePlan({
      carPrice: 120_000_000,
      downPayment: 0,
      termMonths: 24,
      method: 'ANNUITY',
      annualRatePercent: 0,
      paymentDay: 5,
      startDate: START, // 2026-09
    })
    const years = summarizeByYear(r.schedule)
    assert.deepEqual(
      years.map((y) => [y.year, y.months]),
      [
        [2026, 3], // okt, noy, dek
        [2027, 12],
        [2028, 9],
      ],
    )
    const total = years.reduce((s, y) => s + y.total, 0)
    assert.equal(roundMoney(total), roundMoney(r.totalPayable))
  })
})

describe('downPaymentPercent', () => {
  it('foizni hisoblaydi', () => {
    assert.equal(downPaymentPercent(200_000_000, 60_000_000), 30)
    assert.equal(downPaymentPercent(0, 100), 0)
  })
})
