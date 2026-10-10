import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { formatMileage, formatMoney } from '@/lib/format'
import { OG_SIZE, OgBrand, ogFonts, ogText } from '@/lib/og'
import { SITE } from '@/lib/site'
import { isLocale, type Locale } from '@/i18n/config'
import { messagesFor } from '@/i18n/messages'

const LABELS: Record<Locale, { cash: string; price: string; monthly: string; from: string; down: string; daily: string; year: string }> = {
  uz: { cash: 'Naqd narxi', price: 'Narxi', monthly: 'Oylik toʻlov', from: '{v} dan', down: 'Boshlangʻich', daily: 'Kunlik ijara', year: '{y}-yil' },
  ru: { cash: 'Цена за наличные', price: 'Цена', monthly: 'В месяц', from: 'от {v}', down: 'Первый взнос', daily: 'Аренда в сутки', year: '{y} г.' },
  en: { cash: 'Cash price', price: 'Price', monthly: 'Monthly', from: 'from {v}', down: 'Down payment', daily: 'Daily rent', year: '{y}' },
}

export const alt = `Eʼlon — ${SITE.name}`
export const size = OG_SIZE
export const contentType = 'image/png'

/**
 * Yuklangan rasmlar webp — OG renderer uni o'qimaydi, shuning uchun
 * JPEG data URL'ga aylantiramiz. Rasm topilmasa — rasmsiz variant.
 */
async function coverDataUrl(url: string | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const buf = url.startsWith('/')
      ? await readFile(path.join(process.cwd(), 'public', url))
      : Buffer.from(await (await fetch(url)).arrayBuffer())
    const jpeg = await sharp(buf, { density: 144 })
      .resize(560, 630, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string; lang: string }> }) {
  const { slug, lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'uz'
  const L = LABELS[locale]
  const tagline = messagesFor(locale).common.site.tagline
  const l = await prisma.listing.findUnique({
    where: { slug },
    select: {
      title: true,
      year: true,
      mileage: true,
      hasCashSale: true,
      cashPriceUzs: true,
      carPriceUzs: true,
      minMonthlyPaymentUzs: true,
      minDownPaymentUzs: true,
      minDailyRentUzs: true,
      region: { select: { name: true, slug: true } },
      images: {
        orderBy: [{ isCover: 'desc' }, { position: 'asc' }],
        take: 1,
        select: { url: true },
      },
    },
  })

  const fonts = await ogFonts()
  if (!l) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', padding: 72, fontFamily: 'Manrope' }}>
        <OgBrand tagline={ogText(tagline)} />
      </div>,
      { ...size, fonts },
    )
  }

  const photo = await coverDataUrl(l.images[0]?.url)
  const price = l.hasCashSale ? l.cashPriceUzs : l.carPriceUzs
  const rows = [
    price ? { label: l.hasCashSale ? L.cash : L.price, value: formatMoney(Number(price), 'UZS', { locale }) } : null,
    l.minMonthlyPaymentUzs
      ? { label: L.monthly, value: L.from.replace('{v}', formatMoney(Number(l.minMonthlyPaymentUzs), 'UZS', { locale })) }
      : null,
    l.minDownPaymentUzs
      ? { label: L.down, value: formatMoney(Number(l.minDownPaymentUzs), 'UZS', { compact: true, locale }) }
      : null,
    l.minDailyRentUzs ? { label: L.daily, value: formatMoney(Number(l.minDailyRentUzs), 'UZS', { locale }) } : null,
  ].filter((r): r is { label: string; value: string } => r !== null)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', fontFamily: 'Manrope', background: '#ffffff' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 56,
            color: '#0b1c30',
          }}
        >
          <OgBrand tagline={ogText(tagline)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>
              {ogText(l.title)}
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#3f4850' }}>
              {ogText(
                `${L.year.replace('{y}', String(l.year))} · ${formatMileage(l.mileage, locale)} · ${messagesFor(locale).enums.region[l.region.slug] ?? l.region.name}`,
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.slice(0, 3).map((r, i) => (
              <div
                key={r.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderRadius: 14,
                  background: i === 1 ? '#006194' : '#eff4ff',
                  color: i === 1 ? '#ffffff' : '#0b1c30',
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 500 }}>{ogText(r.label)}</span>
                <span style={{ fontSize: 30, fontWeight: 800 }}>{ogText(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
        {photo ? (
          <img src={photo} width={560} height={630} alt="" style={{ objectFit: 'cover' }} />
        ) : null}
      </div>
    ),
    { ...size, fonts },
  )
}
