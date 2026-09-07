import type { Metadata } from 'next'
import Link from 'next/link'
import { Prose } from '@/components/prose'

export const metadata: Metadata = {
  title: 'Loyiha haqida',
  description: 'Arendator — avtomobil rassrochkasi va arendasi uchun ochiq platforma.',
}

export default function AboutPage() {
  return (
    <div className="container-page py-8 lg:py-12">
      <Prose title="Loyiha haqida">
        <p>
          <strong>Arendator</strong> — avtomobilni rassrochka, lizing yoki uzoq
          muddatli arendaga olish uchun eʼlonlar platformasi. Bizning maqsadimiz —
          bu bozordagi eng katta muammoni hal qilish: <strong>shartlarning
          noaniqligi</strong>.
        </p>

        <h2>Muammo</h2>
        <p>
          Odatiy eʼlonlarda faqat &laquo;boshlangʻich toʻlov 30 mln, oyiga
          6 mln&raquo; deb yoziladi. Xaridor jami qancha toʻlashini, ustama necha
          foiz ekanini va grafik qanday boʻlishini faqat ofisga borgandan keyin
          biladi.
        </p>

        <h2>Yechim</h2>
        <ul>
          <li>
            Arendator narx, boshlangʻich toʻlov, muddat va foizni kiritadi — tizim
            <strong> oylik toʻlovni, jami summani va oyma-oy grafikni</strong> oʻzi
            hisoblaydi.
          </li>
          <li>
            Uch xil hisoblash usuli qoʻllab-quvvatlanadi: annuitet (qoldiqqa foiz),
            oddiy ustama va tayyor oylik toʻlov. Oxirgi holatda tizim{' '}
            <strong>samarali yillik foizni teskari hisoblab</strong> chiqaradi —
            shunda xaridor haqiqiy ustamani koʻradi.
          </li>
          <li>
            Xaridor 4 tagacha avtomobilni yonma-yon taqqoslaydi: oylik toʻlov, jami
            toʻlov, ustama ulushi, sugʻurta va mulk huquqi shartlari bir jadvalda.
          </li>
        </ul>

        <h2>Biz nima emasmiz</h2>
        <p>
          Arendator moliyaviy tashkilot emas, kredit bermaydi va shartnoma tuzmaydi.
          Biz — eʼlonlar platformasi. Barcha toʻlov shartlari arendatorlar tomonidan
          kiritiladi va ular oʻz maʼlumotlari uchun javobgardir.
        </p>

        <h2>Boshlash</h2>
        <p>
          <Link href="/elonlar">Eʼlonlarni koʻring</Link>,{' '}
          <Link href="/kalkulyator">kalkulyatorda hisoblang</Link> yoki{' '}
          <Link href="/royxatdan-otish?rol=arendator">arendator sifatida roʻyxatdan oʻting</Link>.
        </p>
      </Prose>
    </div>
  )
}
