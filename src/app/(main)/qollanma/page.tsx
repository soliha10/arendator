import type { Metadata } from 'next'
import Link from 'next/link'
import { Prose } from '@/components/prose'

export const metadata: Metadata = {
  title: 'Arendatorlar uchun qoʻllanma',
  description: 'Eʼlon joylash, toʻlov shartlarini toʻgʻri kiritish boʻyicha qoʻllanma.',
}

export default function GuidePage() {
  return (
    <div className="container-page py-8 lg:py-12">
      <Prose title="Arendatorlar uchun qoʻllanma">
        <p>
          Eʼlon joylash bepul. Quyidagi qadamlar mijoz ishonchini oshiradi va
          arizalar sonini koʻpaytiradi.
        </p>

        <h2>1. Roʻyxatdan oʻting</h2>
        <p>
          <Link href="/royxatdan-otish?rol=arendator">Arendator sifatida</Link>{' '}
          roʻyxatdan oʻting va kompaniya maʼlumotlarini toʻldiring. STIR va
          hujjatlar tekshirilgach hisobingizga <strong>&laquo;Tasdiqlangan&raquo;</strong>{' '}
          belgisi qoʻyiladi — bunday eʼlonlar qidiruvda ustunlik oladi.
        </p>

        <h2>2. Avtomobil maʼlumotlarini kiriting</h2>
        <p>
          Marka, model, yil, yurgan masofa va texnik xususiyatlar. Rost maʼlumot
          yozing — mos kelmasa eʼlon rad etiladi.
        </p>

        <h2>3. Sifatli rasmlar yuklang</h2>
        <ul>
          <li>Kamida 4–6 ta rasm: old, yon, orqa, salon, panel;</li>
          <li>Kunduzi, yaxshi yoritilgan joyda suratga oling;</li>
          <li>Birinchi rasm muqova boʻladi — eng yaxshisini tanlang.</li>
        </ul>

        <h2>4. Toʻlov shartlarini kiriting</h2>
        <p>
          Bu — eng muhim qadam. Uchta hisoblash usulidan birini tanlaysiz:
        </p>
        <ul>
          <li>
            <strong>Annuitet</strong> — foiz har oy qolgan qarzga hisoblanadi. Bank
            va lizing kompaniyalari shu usuldan foydalanadi. Ustama eng kam chiqadi.
          </li>
          <li>
            <strong>Oddiy ustama</strong> — foiz butun summaga bir marta qoʻshilib,
            oylarga teng boʻlinadi. Hisoblash sodda, lekin ustama yuqoriroq.
          </li>
          <li>
            <strong>Oylik toʻlovni oʻzim kiritaman</strong> — siz aniq summani
            yozasiz, tizim samarali yillik foizni teskari hisoblaydi. Odatda
            avtosalonlar shu usulda ishlaydi.
          </li>
        </ul>
        <p>
          Har bir shart uchun grafik avtomatik quriladi. Formaning oʻng tomonida
          natijani darhol koʻrasiz.
        </p>

        <h3>Bir nechta shart qoʻshing</h3>
        <p>
          Tajriba shuni koʻrsatadiki, 12 / 24 / 36 oylik uchta variant taklif
          qilingan eʼlonlar bittasi bor eʼlonlardan sezilarli koʻp ariza oladi.
          Mijoz oʻz imkoniyatiga mos variantni tanlaydi.
        </p>

        <h2>5. Moderatsiyani kuting</h2>
        <p>
          Eʼlon tekshiruvdan oʻtadi (odatda bir necha soat). Rad etilsa, sabab
          koʻrsatiladi — tuzatib qayta yuborishingiz mumkin.
        </p>

        <h2>6. Arizalarga tez javob bering</h2>
        <p>
          <Link href="/kabinet/arizalar">Arizalar</Link> boʻlimida har bir murojaat
          holatini belgilab boring. Tez javob — koʻproq bitim.
        </p>

        <h2>Nima rad etiladi</h2>
        <ul>
          <li>Rasm yoʻq yoki internetdan olingan rasmlar;</li>
          <li>Toʻlov shartlari kiritilmagan yoki haqiqatga mos kelmaydi;</li>
          <li>Bitta avtomobil bir necha marta joylangan;</li>
          <li>Eʼlon matnida boshqa saytga havola yoki reklama.</li>
        </ul>
      </Prose>
    </div>
  )
}
