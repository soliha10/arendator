import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Demo uchun offline rasm generatori.
 * Haqiqiy loyihada bu rasmlar arendator yuklagan fotosuratlar bilan almashadi.
 */

const CAR_SILHOUETTE =
  'M92 252 q4 -46 44 -60 l60 -34 q26 -14 58 -16 l96 -6 q40 -2 74 18 l86 50 68 12 ' +
  'q28 6 30 34 l0 12 q0 10 -12 10 l-40 0 a34 34 0 0 0 -68 0 l-198 0 a34 34 0 0 0 -68 0 ' +
  'l-38 0 q-14 0 -14 -12 z'

const WINDOWS =
  'M196 168 l50 -28 q20 -11 44 -12 l52 -3 0 46 z M366 171 l0 -44 34 -2 q30 -2 56 14 l58 34 z'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildCarSvg(opts: {
  title: string
  subtitle?: string
  from: string
  to: string
  angle: number
}): string {
  const { title, from, to, angle } = opts
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${to}"/>
      <stop offset="55%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.62"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#bg)"/>
  <circle cx="530" cy="70" r="150" fill="#ffffff" opacity="0.06"/>
  <circle cx="90" cy="330" r="120" fill="#000000" opacity="0.08"/>
  <g transform="translate(0 26)">
    <ellipse cx="330" cy="292" rx="240" ry="16" fill="#000000" opacity="0.18"/>
    <path d="${CAR_SILHOUETTE}" fill="url(#body)"/>
    <path d="${WINDOWS}" fill="${to}" opacity="0.55"/>
    <circle cx="204" cy="272" r="34" fill="#12151a"/>
    <circle cx="204" cy="272" r="15" fill="#ffffff" opacity="0.75"/>
    <circle cx="470" cy="272" r="34" fill="#12151a"/>
    <circle cx="470" cy="272" r="15" fill="#ffffff" opacity="0.75"/>
  </g>
</svg>`
}

/** next/image `placeholder="blur"` uchun juda kichik data URI */
export function buildBlurDataUrl(from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5"><defs><linearGradient id="g"><stop offset="0%" stop-color="${to}"/><stop offset="100%" stop-color="${from}"/></linearGradient></defs><rect width="8" height="5" fill="url(#g)"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export async function writeCarImage(
  publicDir: string,
  relPath: string,
  svg: string,
): Promise<string> {
  const full = path.join(publicDir, relPath)
  await mkdir(path.dirname(full), { recursive: true })
  await writeFile(full, svg, 'utf8')
  return `/${relPath.split(path.sep).join('/')}`
}
