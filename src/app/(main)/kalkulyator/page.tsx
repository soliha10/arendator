import type { Metadata } from 'next'
import Link from 'next/link'
import { Calc } from './calculator'

export const metadata: Metadata = {
  title: 'Rassrochka kalkulyatori',
  description:
    'Boshlangʻich toʻlov, muddat va foiz asosida oylik toʻlovni va toʻliq grafikni hisoblang.',
}

export default function CalculatorPage() {
  return (
    <div className="container-page py-4 sm:py-6 lg:py-8">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
          Rassrochka kalkulyatori
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Oylik toʻlov, jami ustama va toʻliq grafikni hisoblang. Bu — arendatorlar
          eʼlon joylashda ishlatadigan hisoblash moduli, siz ham xuddi shu natijani
          olasiz.{' '}
          <Link href="/elonlar" className="text-primary hover:underline">
            Tayyor takliflarni koʻrish →
          </Link>
        </p>
      </div>

      <Calc />

      <p className="mt-8 text-[12px] leading-relaxed text-subtle">
        Hisob-kitob taxminiy boʻlib, maʼlumot uchun beriladi. Yakuniy shartlar
        arendator bilan tuziladigan shartnomada belgilanadi.
      </p>
    </div>
  )
}
