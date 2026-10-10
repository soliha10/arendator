import type { Metadata } from 'next'
import { CompareTable } from './compare-table'

export const metadata: Metadata = {
  title: 'Taqqoslash',
  description:
    'Tanlagan avtomobillarni oylik toʻlov, boshlangʻich toʻlov, ustama va shartlar boʻyicha yonma-yon solishtiring.',
}

export default function ComparePage() {
  return (
    <div className="container-page py-6 lg:py-8">
      <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">Taqqoslash</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">
        Har bir avtomobil uchun toʻlov shartini tanlang — jadval avtomatik
        yangilanadi va eng qulay qiymatlar ajratib koʻrsatiladi.
      </p>

      <div className="mt-6">
        <CompareTable />
      </div>
    </div>
  )
}
