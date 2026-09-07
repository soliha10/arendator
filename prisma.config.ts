import { defineConfig, env } from 'prisma/config'

// Prisma 7 .env faylini avtomatik o'qimaydi — Node'ning o'z funksiyasidan foydalanamiz.
try {
  process.loadEnvFile('.env')
} catch {
  // .env yo'q (masalan CI/production) — env o'zgaruvchilari tashqaridan beriladi
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // CLI (migrate/introspect) uchun to'g'ridan-to'g'ri ulanish.
  // Neon/PgBouncer ishlatilganda bu pooler EMAS, direct URL bo'lishi kerak.
  datasource: {
    url: env('DIRECT_URL'),
  },
  migrations: {
    seed: 'tsx --env-file=.env prisma/seed.ts',
  },
})
