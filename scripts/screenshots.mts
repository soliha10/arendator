/**
 * Vizual tekshiruv: asosiy sahifalarni brauzerda ochib, skrinshot oladi.
 *
 *   npx tsx --env-file=.env scripts/screenshots.mts [--out=./shots] [--base=http://localhost:3000]
 *
 * Tizimdagi Chrome ishlatiladi (Chromium yuklab olinmaydi).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { signSession, SESSION_COOKIE_NAME } from '../src/lib/auth/jwt'

const arg = (name: string, fallback: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback

const BASE = arg('base', 'http://localhost:3000')
const OUT = path.resolve(arg('out', './shots'))

/**
 * Qurilma profillari. `hasTouch` yoqilganda Chrome sensorli kirishni
 * emulyatsiya qiladi va `hover: none` / `pointer: coarse` media
 * soʻrovlari ishga tushadi — sensorli uslublar ham tekshiriladi.
 */
const DEVICES = {
  mobile: { width: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
} as const

type DeviceName = keyof typeof DEVICES

const DEVICE_ARG = arg('device', 'both')
const ACTIVE_DEVICES: DeviceName[] =
  DEVICE_ARG === 'both' ? ['mobile', 'desktop'] : [DEVICE_ARG as DeviceName]

const THEME_ARG = arg('theme', 'both')

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  process.env.CHROME_PATH ?? '',
].filter(Boolean)

async function findChrome(): Promise<string> {
  const { access } = await import('node:fs/promises')
  for (const p of CHROME_PATHS) {
    try {
      await access(p)
      return p
    } catch {
      /* keyingisi */
    }
  }
  throw new Error('Chrome topilmadi. CHROME_PATH env oʻzgaruvchisini bering.')
}

interface Shot {
  name: string
  url: string
  as?: 'arendator' | 'admin'
  height?: number
  wait?: number
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })

  const tokenFor = async (phone: string) => {
    const u = await prisma.user.findUniqueOrThrow({
      where: { phone },
      select: { id: true, role: true, tokenVersion: true, fullName: true },
    })
    return signSession({ sub: u.id, role: u.role, tv: u.tokenVersion, name: u.fullName })
  }

  const tokens = {
    arendator: await tokenFor('+998901234501'),
    admin: await tokenFor('+998901112233'),
  }

  const listing = await prisma.listing.findFirstOrThrow({
    where: { status: 'ACTIVE' },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
  })
  const compareIds = (
    await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
      take: 3,
      orderBy: { minMonthlyPaymentUzs: 'asc' },
    })
  )
    .map((l) => l.id)
    .join(',')

  await prisma.$disconnect()

  const shots: Shot[] = [
    { name: '01-bosh-sahifa', url: '/', height: 1600 },
    { name: '02-katalog', url: '/elonlar', height: 1500 },
    { name: '03-elon', url: `/elon/${listing.slug}`, height: 1900 },
    { name: '04-taqqoslash', url: `/taqqoslash?ids=${compareIds}`, height: 1700 },
    { name: '05-kalkulyator', url: '/kalkulyator', height: 1300 },
    { name: '06-kirish', url: '/kirish', height: 900 },
    { name: '07-arendatorlar', url: '/arendatorlar', height: 1000 },
    { name: '08-kabinet', url: '/kabinet', as: 'arendator', height: 1100 },
    { name: '09-elonlarim', url: '/kabinet/elonlarim', as: 'arendator', height: 1200 },
    { name: '10-yangi-elon', url: '/kabinet/elon/yangi', as: 'arendator', height: 1400 },
    { name: '11-arizalar', url: '/kabinet/arizalar', as: 'arendator', height: 1000 },
    { name: '12-admin', url: '/admin', as: 'admin', height: 900 },
    { name: '13-moderatsiya', url: '/admin/moderatsiya', as: 'admin', height: 1000 },
  ]

  await mkdir(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: await findChrome(),
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars'],
  })

  const themes = (THEME_ARG === 'both' ? ['dark', 'light'] : [THEME_ARG]) as (
    | 'dark'
    | 'light'
  )[]

  for (const device of ACTIVE_DEVICES) {
    const d = DEVICES[device]
    for (const theme of themes) {
      for (const shot of shots) {
      const page = await browser.newPage()
      await page.setViewport({
        width: d.width,
        // Telefonda sahifa balandroq choziladi
        height: Math.round((shot.height ?? 1200) * (device === 'mobile' ? 1.35 : 1)),
        deviceScaleFactor: d.deviceScaleFactor,
        isMobile: d.isMobile,
        hasTouch: d.hasTouch,
      })
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: theme },
      ])

      if (shot.as) {
        const url = new URL(BASE)
        await browser.setCookie({
          name: SESSION_COOKIE_NAME,
          value: tokens[shot.as],
          domain: url.hostname,
          path: '/',
          httpOnly: true,
        })
      }

      const target = `${BASE}${shot.url}`
      await page.goto(target, { waitUntil: 'networkidle2', timeout: 45_000 })
      await new Promise((r) => setTimeout(r, shot.wait ?? 700))

      const file = path.join(OUT, `${device}-${shot.name}-${theme}.png`)
      await page.screenshot({ path: file as `${string}.png` })
      console.log(`  ✓ ${path.basename(file)}`)
      await page.close()
      }
    }
  }

  await browser.close()
  console.log(`\nSkrinshotlar: ${OUT}`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
