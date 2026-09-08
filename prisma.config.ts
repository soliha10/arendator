import { defineConfig } from 'prisma/config'

// Prisma 7 .env faylini avtomatik o'qimaydi — Node'ning o'z funksiyasidan foydalanamiz.
try {
  process.loadEnvFile('.env')
} catch {
  // .env yo'q (masalan CI/production) — env o'zgaruvchilari tashqaridan beriladi
}

// CLI (migrate/introspect) uchun to'g'ridan-to'g'ri ulanish.
// Neon/PgBouncer ishlatilganda bu pooler EMAS, direct URL bo'lishi kerak.
const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // `prisma generate` ulanishsiz ham ishlaydi. URL yo'qligida konfiguratsiya
  // yiqilmasligi kerak — aks holda Vercel'dagi postinstall butun buildni buzadi.
  ...(directUrl ? { datasource: { url: directUrl } } : {}),
  migrations: {
    seed: 'tsx --env-file=.env prisma/seed.ts',
  },
})
