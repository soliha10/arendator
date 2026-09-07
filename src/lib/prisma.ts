import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Prisma 7 driver adapter talab qiladi. Bu bizga pool sozlamalarini
 * aniq boshqarish imkonini beradi — serverless muhitda muhim.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL o\'rnatilmagan. .env faylini tekshiring.')
  }

  const adapter = new PrismaPg({
    connectionString,
    // Serverless (Vercel) da har instansiya kam ulanish ushlab tursin
    max: Number(process.env.DB_POOL_MAX ?? (process.env.VERCEL ? 1 : 10)),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  })
}

// Dev'da hot-reload har safar yangi pool ochib yubormasligi uchun
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
