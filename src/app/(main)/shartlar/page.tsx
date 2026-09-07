import type { Metadata } from 'next'
import { Prose } from '@/components/prose'

export const metadata: Metadata = {
  title: 'Foydalanish shartlari',
  description: 'Arendator platformasidan foydalanish qoidalari.',
}

export default function TermsPage() {
  return (
    <div className="container-page py-8 lg:py-12">
      <Prose title="Foydalanish shartlari" updatedAt="2026-yil">
        <p>
          Platformadan foydalanish orqali siz quyidagi shartlarga rozilik
          bildirasiz. Shartlar oʻzgarganda sahifadagi sana yangilanadi.
        </p>

        <h2>1. Platformaning maqomi</h2>
        <p>
          Arendator — eʼlonlar joylash xizmati. Platforma tomon sifatida
          shartnomalarda ishtirok etmaydi, toʻlovlarni qabul qilmaydi va moliyaviy
          xizmat koʻrsatmaydi. Barcha kelishuvlar xaridor va arendator oʻrtasida
          bevosita tuziladi.
        </p>

        <h2>2. Arendatorlarning majburiyatlari</h2>
        <ul>
          <li>Faqat haqiqiy, mavjud avtomobillar haqida eʼlon joylash;</li>
          <li>Toʻlov shartlarini toʻliq va toʻgʻri koʻrsatish — yashirin toʻlovlarsiz;</li>
          <li>Eʼlonda koʻrsatilgan shartlarga rioya qilish;</li>
          <li>Avtomobil berilgan yoki mavjud boʻlmasa, eʼlonni toʻxtatish.</li>
        </ul>

        <h2>3. Foydalanuvchilarning majburiyatlari</h2>
        <ul>
          <li>Ariza qoldirishda haqiqiy maʼlumot koʻrsatish;</li>
          <li>Platformadan spam yoki firibgarlik uchun foydalanmaslik.</li>
        </ul>

        <h2>4. Moderatsiya</h2>
        <p>
          Har bir yangi eʼlon chop etilishidan oldin tekshiruvdan oʻtadi. Qoidalarga
          zid eʼlonlar rad etiladi, takroriy buzilishda hisob bloklanishi mumkin.
        </p>

        <h2>5. Masʼuliyat</h2>
        <p>
          Platforma eʼlonlardagi maʼlumotlar aniqligi va tomonlar oʻrtasidagi
          kelishuv bajarilishi uchun javobgar emas. Shartnoma imzolashdan oldin
          hujjatlarni mustaqil tekshiring.
        </p>

        <h2>6. Hisobni oʻchirish</h2>
        <p>
          Istalgan vaqtda hisobingizni oʻchirishni soʻrashingiz mumkin. Bunda
          eʼlonlaringiz va shaxsiy maʼlumotlaringiz oʻchiriladi.
        </p>
      </Prose>
    </div>
  )
}
