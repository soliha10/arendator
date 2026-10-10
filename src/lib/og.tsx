import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { SITE } from './site'

/**
 * Ijtimoiy tarmoq / Telegram ulashish rasmlari uchun umumiy qism.
 * Manrope shriftida "ʻ" belgisi yo'q — ’ ga almashtiriladi.
 */
export const OG_SIZE = { width: 1200, height: 630 }

export const ogText = (s: string) => s.replace(/[ʻʼ`']/g, '’')

export async function ogFonts() {
  const dir = path.join(process.cwd(), 'assets', 'fonts')
  const [regular, bold] = await Promise.all([
    readFile(path.join(dir, 'Manrope-500.ttf')),
    readFile(path.join(dir, 'Manrope-800.ttf')),
  ])
  return [
    { name: 'Manrope', data: regular, weight: 500 as const, style: 'normal' as const },
    { name: 'Manrope', data: bold, weight: 800 as const, style: 'normal' as const },
  ]
}

/** Chap yuqoridagi brend belgisi */
export function OgBrand({ light = false, tagline = 'Arenda · Rassrochka · Lizing' }: { light?: boolean; tagline?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: light ? '#ffffff' : 'linear-gradient(135deg,#006194,#0284c7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="34" height="34" viewBox="0 0 64 64">
          <path
            d="M12 36 16.3 24a8 8 0 0 1 7.5-5.3h16.4a8 8 0 0 1 7.5 5.3L52 36v12a2.7 2.7 0 0 1-2.7 2.7h-4a2.7 2.7 0 0 1-2.6-2.7v-2.7H21.3V48a2.7 2.7 0 0 1-2.6 2.7h-4A2.7 2.7 0 0 1 12 48z"
            fill="none"
            stroke={light ? '#006194' : '#ffffff'}
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: light ? '#ffffff' : '#006194' }}>
          {SITE.name}
        </span>
        <span style={{ fontSize: 18, fontWeight: 500, color: light ? '#cfe6ff' : '#3f4850' }}>
          {tagline}
        </span>
      </div>
    </div>
  )
}
