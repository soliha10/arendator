/**
 * Brend va aloqa ma'lumotlari — bitta joyda.
 * Nom yoki telefon o'zgarsa, faqat shu fayl (yoki env) yangilanadi:
 * header, footer, metadata, JSON-LD va OG rasmlar shu yerdan o'qiydi.
 */
export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Arendator',
  tagline: 'Avto arenda, rassrochka va lizing',
  description:
    'Oʻzbekistonda avtomobilni arendaga, muddatli toʻlovga (rassrochka) yoki lizingga oling. Boshlangʻich va oylik toʻlov, toʻliq grafik — bir joyda taqqoslang.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '+998712000000',
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'info@arendator.uz',
  telegram: process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM ?? 'arendator_uz',
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? '',
  workingHours: 'Dush–Shan, 09:00–20:00',
  city: 'Toshkent',
} as const

export const telegramUrl = (username: string) =>
  `https://t.me/${username.replace(/^@/, '')}`
