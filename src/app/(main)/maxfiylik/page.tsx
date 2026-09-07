import type { Metadata } from 'next'
import { Prose } from '@/components/prose'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati',
  description: 'Shaxsiy maʼlumotlar qanday yigʻiladi va ishlatiladi.',
}

export default function PrivacyPage() {
  return (
    <div className="container-page py-8 lg:py-12">
      <Prose title="Maxfiylik siyosati" updatedAt="2026-yil">
        <h2>Qanday maʼlumot yigʻamiz</h2>
        <ul>
          <li>
            <strong>Roʻyxatdan oʻtishda:</strong> ism-familiya, telefon raqami,
            email (ixtiyoriy).
          </li>
          <li>
            <strong>Arendatorlardan:</strong> kompaniya nomi, STIR, manzil, aloqa
            maʼlumotlari.
          </li>
          <li>
            <strong>Foydalanish davomida:</strong> saqlangan eʼlonlar, yuborilgan
            arizalar.
          </li>
        </ul>

        <h2>Maʼlumot qanday ishlatiladi</h2>
        <ul>
          <li>Xizmatni koʻrsatish: eʼlonlar, arizalar, taqqoslash;</li>
          <li>Ariza yuborganda telefon raqamingiz tegishli arendatorga koʻrsatiladi;</li>
          <li>Xavfsizlik: spam va firibgarlikning oldini olish.</li>
        </ul>

        <h2>Nimalarni qilmaymiz</h2>
        <p>
          Shaxsiy maʼlumotlaringizni uchinchi tomonlarga sotmaymiz va reklama
          maqsadida uzatmaymiz.
        </p>

        <h2>Parollar xavfsizligi</h2>
        <p>
          Parollar bcrypt algoritmi bilan shifrlab saqlanadi — hech kim, jumladan
          platforma xodimlari ham, sizning parolingizni koʻra olmaydi. Parol
          oʻzgartirilganda barcha boshqa qurilmalardagi sessiyalar bekor qilinadi.
        </p>

        <h2>Cookie fayllar</h2>
        <p>
          Faqat zarur cookie ishlatiladi: sessiya (tizimga kirganingizni eslab
          qolish) va mavzu tanlovi. Kuzatuv (tracking) cookie ishlatilmaydi.
        </p>

        <h2>Huquqlaringiz</h2>
        <p>
          Maʼlumotlaringizni koʻrish, tuzatish yoki oʻchirishni soʻrashingiz mumkin —
          buning uchun <a href="mailto:info@arendator.uz">info@arendator.uz</a> ga
          yozing.
        </p>
      </Prose>
    </div>
  )
}
