/**
 * Grafikni SHARTNOMA yillari bo'yicha guruhlaydi: 1-yil = 1–12 oylar.
 * `summarizeByYear` (finance.ts) kalendar yili bo'yicha guruhlaydi — u
 * "2026-yilda qancha to'layman" savoliga javob. Xaridor uchun esa
 * "birinchi yilda qancha" savoli tushunarliroq, dizayn ham shunday.
 */
export interface ContractYear {
  index: number // 1, 2, 3...
  fromMonth: number
  toMonth: number
  total: number
  principal: number
  markup: number
  /** yil oxiridagi qoldiq qarz */
  balanceEnd: number
  /** yil oxirigacha to'langan asosiy qarz ulushi, % (egalik ulushi) */
  paidShare: number
}

interface Row {
  monthIndex: number
  amount: number
  principal: number
  markup: number
  balanceAfter: number
}

export function groupByContractYear(rows: Row[]): ContractYear[] {
  if (rows.length === 0) return []
  const financed = rows.reduce((s, r) => s + r.principal, 0)
  const out: ContractYear[] = []
  let paid = 0
  for (let i = 0; i < rows.length; i += 12) {
    const chunk = rows.slice(i, i + 12)
    const principal = chunk.reduce((s, r) => s + r.principal, 0)
    paid += principal
    out.push({
      index: out.length + 1,
      fromMonth: chunk[0].monthIndex,
      toMonth: chunk[chunk.length - 1].monthIndex,
      total: chunk.reduce((s, r) => s + r.amount, 0),
      principal,
      markup: chunk.reduce((s, r) => s + r.markup, 0),
      balanceEnd: chunk[chunk.length - 1].balanceAfter,
      paidShare: financed > 0 ? Math.min(100, (paid / financed) * 100) : 100,
    })
  }
  return out
}
