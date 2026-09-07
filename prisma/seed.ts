import path from 'node:path'
import { rm } from 'node:fs/promises'
import type { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma'
import { hashPassword } from '../src/lib/auth/password'
import { slugify } from '../src/lib/utils'
import { createPlanWithSchedule, recalcListingAggregates, recalcProfileCounters } from '../src/server/plan-service'
import { getRates } from '../src/server/exchange'
import type { PlanOutput } from '../src/lib/validation/listing'
import { BRANDS, BRAND_COLORS, CARS, COMPANIES, REGIONS } from './seed-data'
import { buildBlurDataUrl, buildCarSvg, writeCarImage } from './placeholder'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const DEMO_PASSWORD = 'parol12345'

/** Determinizm uchun oddiy PRNG — har safar bir xil demo ma'lumot */
function makeRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}
const rnd = makeRandom(42)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]
const between = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1))

function planDefaults(overrides: Partial<PlanOutput> & Pick<PlanOutput,
  'name' | 'carPrice' | 'downPayment' | 'termMonths'>): PlanOutput {
  return {
    planType: 'INSTALLMENT',
    currency: 'UZS',
    calcMethod: 'ANNUITY',
    annualRatePercent: 0,
    paymentDay: 5,
    insuranceIncluded: false,
    cascoIncluded: false,
    maintenanceIncluded: false,
    ownershipTransfer: true,
    earlyPayoffAllowed: true,
    isDefault: false,
    ...overrides,
  } as PlanOutput
}

async function main() {
  console.log('🌱 Seed boshlandi...')

  // ── 0. Tozalash ────────────────────────────────────────────
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.review.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.scheduleItem.deleteMany(),
    prisma.rentalPlan.deleteMany(),
    prisma.listingImage.deleteMany(),
    prisma.listing.deleteMany(),
    prisma.arendatorProfile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.carModel.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.region.deleteMany(),
    prisma.exchangeRate.deleteMany(),
  ])
  await rm(path.join(PUBLIC_DIR, 'uploads', 'seed'), { recursive: true, force: true })

  // ── 1. Valyuta kurslari ────────────────────────────────────
  await prisma.exchangeRate.createMany({
    data: [
      { currency: 'UZS', rateToUzs: 1 },
      { currency: 'USD', rateToUzs: 12_800 },
    ],
  })
  const rates = await getRates()

  // ── 2. Viloyatlar ──────────────────────────────────────────
  await prisma.region.createMany({
    data: REGIONS.map((name) => ({ name, slug: slugify(name) })),
  })
  const regions = await prisma.region.findMany()
  const regionByName = new Map(regions.map((r) => [r.name, r]))
  console.log(`   ${regions.length} ta viloyat`)

  // ── 3. Markalar va modellar ────────────────────────────────
  for (const [brandName, models] of Object.entries(BRANDS)) {
    await prisma.brand.create({
      data: {
        name: brandName,
        slug: slugify(brandName),
        models: {
          createMany: {
            data: models.map((m) => ({ name: m, slug: slugify(m) })),
          },
        },
      },
    })
  }
  const brands = await prisma.brand.findMany({ include: { models: true } })
  const brandByName = new Map(brands.map((b) => [b.name, b]))
  const modelCount = brands.reduce((s, b) => s + b.models.length, 0)
  console.log(`   ${brands.length} ta marka, ${modelCount} ta model`)

  // ── 4. Foydalanuvchilar ────────────────────────────────────
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  const admin = await prisma.user.create({
    data: {
      phone: '+998901112233',
      email: 'admin@arendator.uz',
      fullName: 'Admin Adminov',
      passwordHash,
      role: 'ADMIN',
      isPhoneVerified: true,
    },
  })

  const arendators = []
  for (const c of COMPANIES) {
    const user = await prisma.user.create({
      data: {
        phone: c.phone,
        email: c.email,
        fullName: c.fullName,
        passwordHash,
        role: 'ARENDATOR',
        isPhoneVerified: true,
        profile: {
          create: {
            slug: slugify(c.companyName),
            companyName: c.companyName,
            legalName: `"${c.companyName}" MChJ`,
            inn: String(between(200000000, 399999999)),
            about: c.about,
            address: `${c.region}, Amir Temur koʻchasi ${between(1, 180)}`,
            regionId: regionByName.get(c.region)?.id,
            telegram: c.telegram,
            workingHours: c.workingHours,
            isVerified: c.verified,
            verifiedAt: c.verified ? new Date() : null,
          },
        },
      },
      include: { profile: true },
    })
    arendators.push(user)
  }

  const buyers = []
  for (const [i, name] of ['Ulugʻbek Nazarov', 'Malika Yusupova', 'Bekzod Ergashev'].entries()) {
    buyers.push(
      await prisma.user.create({
        data: {
          phone: `+99890555110${i}`,
          fullName: name,
          passwordHash,
          role: 'USER',
          isPhoneVerified: true,
        },
      }),
    )
  }
  console.log(`   1 admin, ${arendators.length} arendator, ${buyers.length} foydalanuvchi`)

  // ── 5. E'lonlar ────────────────────────────────────────────
  let listingIndex = 0
  const createdListings: { id: string; ownerId: string }[] = []

  for (const car of CARS) {
    listingIndex += 1
    const brand = brandByName.get(car.brand)
    if (!brand) continue
    const model = brand.models.find((m) => m.name === car.model)
    if (!model) continue

    const owner = arendators[listingIndex % arendators.length]
    const region = regionByName.get(
      COMPANIES[listingIndex % COMPANIES.length].region,
    )!

    const title = `${car.brand} ${car.model} ${car.year}`
    const slug = `${slugify(title)}-${listingIndex.toString().padStart(3, '0')}`
    const [from, to] = BRAND_COLORS[car.brand] ?? ['#3f4a5a', '#161b22']

    // Rasmlar (3 ta rakurs)
    const angles = [25, 155, 300]
    const images: Prisma.ListingImageCreateWithoutListingInput[] = []
    for (const [i, angle] of angles.entries()) {
      const svg = buildCarSvg({ title, from, to, angle })
      const url = await writeCarImage(
        PUBLIC_DIR,
        path.join('uploads', 'seed', `${slug}-${i + 1}.svg`),
        svg,
      )
      images.push({
        url,
        width: 640,
        height: 400,
        blurDataUrl: buildBlurDataUrl(from, to),
        position: i,
        isCover: i === 0,
      })
    }

    const daysAgo = between(0, 25)
    const publishedAt = new Date(Date.now() - daysAgo * 86_400_000)

    const listing = await prisma.listing.create({
      data: {
        slug,
        ownerId: owner.id,
        title,
        description:
          `${title} — ${car.condition === 'NEW' ? 'yangi, salondan' : `${car.mileage.toLocaleString('uz-UZ')} km yurgan`}. ` +
          `${car.engine ? `Dvigatel ${car.engine} L, ` : ''}${car.drive === 'AWD' ? 'toʻliq uzatma' : car.drive === 'RWD' ? 'orqa uzatma' : 'oldi uzatma'}. ` +
          `Avtomobil texnik koʻrikdan oʻtgan, hujjatlari toza. Rassrochka rasmiy shartnoma asosida rasmiylashtiriladi. ` +
          `Boshlangʻich toʻlovdan soʻng avtomobil darhol topshiriladi.`,
        brandId: brand.id,
        modelId: model.id,
        year: car.year,
        bodyType: car.body,
        transmission: car.transmission,
        fuelType: car.fuel,
        driveType: car.drive,
        engineVolume: car.engine || null,
        color: car.color,
        mileage: car.mileage,
        condition: car.condition,
        seats: car.body === 'MINIVAN' ? 7 : 5,
        regionId: region.id,
        address: `${region.name}, avtosalon`,
        contactPhone: owner.phone,
        contactName: owner.fullName,
        status: 'ACTIVE',
        isFeatured: listingIndex % 7 === 0,
        viewCount: between(15, 2400),
        publishedAt,
        expiresAt: new Date(publishedAt.getTime() + 30 * 86_400_000),
        images: { create: images },
      },
      select: { id: true, ownerId: true },
    })

    // ── To'lov shartlari ────────────────────────────────────
    const price = car.price
    const startDate = new Date(publishedAt)

    const plans: PlanOutput[] = [
      planDefaults({
        name: '12 oylik rassrochka',
        termMonths: 12,
        carPrice: price,
        downPayment: Math.round(price * 0.4),
        annualRatePercent: between(14, 20),
        calcMethod: 'ANNUITY',
        startDate,
        paymentDay: 5,
        insuranceIncluded: true,
        requiredDocuments: 'Passport, haydovchilik guvohnomasi, daromad haqida maʼlumotnoma',
        isDefault: false,
      }),
      planDefaults({
        name: '24 oylik rassrochka',
        termMonths: 24,
        carPrice: price,
        downPayment: Math.round(price * 0.3),
        annualRatePercent: between(20, 28),
        calcMethod: 'ANNUITY',
        startDate,
        paymentDay: 10,
        insuranceIncluded: true,
        cascoIncluded: listingIndex % 3 === 0,
        penaltyPerDay: Math.round(price * 0.0002),
        requiredDocuments: 'Passport, haydovchilik guvohnomasi, kafil',
        isDefault: true,
      }),
      planDefaults({
        name: '36 oylik rassrochka',
        termMonths: 36,
        carPrice: price,
        downPayment: Math.round(price * 0.25),
        annualRatePercent: between(24, 34),
        calcMethod: listingIndex % 4 === 0 ? 'FLAT' : 'ANNUITY',
        startDate,
        paymentDay: 15,
        insuranceIncluded: true,
        maintenanceIncluded: listingIndex % 5 === 0,
        requiredDocuments: 'Passport, haydovchilik guvohnomasi, 2 ta kafil',
        notes: 'Uzoq muddatli shart — oylik toʻlov eng past, ammo ustama yuqoriroq.',
      }),
    ]

    // Har uchinchi e'longa arenda sharti ham qo'shamiz
    if (listingIndex % 3 === 0) {
      plans.push(
        planDefaults({
          name: 'Uzoq muddatli arenda (12 oy)',
          planType: 'RENT',
          termMonths: 12,
          carPrice: price,
          downPayment: Math.round(price * 0.08),
          calcMethod: 'FIXED',
          monthlyPaymentInput: Math.round((price * 0.028) / 10_000) * 10_000,
          startDate,
          paymentDay: 1,
          ownershipTransfer: false,
          insuranceIncluded: true,
          cascoIncluded: true,
          maintenanceIncluded: true,
          depositAmount: Math.round(price * 0.05),
          mileageLimitPerYear: 30_000,
          extraMileageFee: 1_500,
          notes: 'Sugʻurta, KASKO va texnik xizmat narxga kiritilgan. Mulk huquqi oʻtmaydi.',
        }),
      )
    }

    for (const plan of plans) {
      await createPlanWithSchedule(prisma, listing.id, plan, rates)
    }
    await recalcListingAggregates(prisma, listing.id)
    createdListings.push(listing)
  }
  console.log(`   ${createdListings.length} ta eʼlon (rasm + toʻlov shartlari + grafik)`)

  // ── 6. Moderatsiyada turgan e'lonlar (admin panel uchun) ───
  const pendingCar = CARS[0]
  const pendingBrand = brandByName.get(pendingCar.brand)!
  await prisma.listing.create({
    data: {
      slug: 'chevrolet-cobalt-2023-tekshiruvda',
      ownerId: arendators[2].id,
      title: 'Chevrolet Cobalt 2023 (tekshiruvda)',
      description: 'Moderatsiya kutayotgan namunaviy eʼlon.',
      brandId: pendingBrand.id,
      modelId: pendingBrand.models.find((m) => m.name === 'Cobalt')!.id,
      year: 2023,
      bodyType: 'SEDAN',
      transmission: 'AUTOMATIC',
      fuelType: 'GAS_PETROL',
      driveType: 'FWD',
      engineVolume: 1.5,
      color: 'Oq',
      mileage: 18_000,
      condition: 'USED',
      regionId: regions[0].id,
      contactPhone: arendators[2].phone,
      status: 'PENDING',
      images: {
        create: [
          {
            url: await writeCarImage(
              PUBLIC_DIR,
              path.join('uploads', 'seed', 'pending-cobalt.svg'),
              buildCarSvg({
                title: 'Chevrolet Cobalt 2023',
                from: '#c9a227',
                to: '#3d2f00',
                angle: 45,
              }),
            ),
            width: 640,
            height: 400,
            blurDataUrl: buildBlurDataUrl('#c9a227', '#3d2f00'),
            isCover: true,
          },
        ],
      },
    },
  })

  // ── 7. Sevimlilar, arizalar va sharhlar ────────────────────
  const sample = createdListings.slice(0, 12)
  for (const buyer of buyers) {
    for (const l of sample.filter(() => rnd() > 0.6)) {
      await prisma.favorite
        .create({ data: { userId: buyer.id, listingId: l.id } })
        .catch(() => {})
    }
  }
  for (const l of sample) {
    const count = await prisma.favorite.count({ where: { listingId: l.id } })
    await prisma.listing.update({
      where: { id: l.id },
      data: { favoriteCount: count },
    })
  }

  const leadMessages = [
    'Assalomu alaykum, shu mashina hali bormi? Boshlangʻich toʻlovni kamaytirsa boʻladimi?',
    '24 oylik shart boʻyicha qiziqyapman. Qachon koʻrsam boʻladi?',
    'Kafilsiz rasmiylashtirish imkoni bormi?',
    'Naqd toʻlasam chegirma bormi?',
  ]
  let leadCount = 0
  for (const l of sample.slice(0, 8)) {
    const plansForListing = await prisma.rentalPlan.findMany({
      where: { listingId: l.id },
      select: { id: true },
    })
    const n = between(1, 3)
    for (let i = 0; i < n; i++) {
      const buyer = pick(buyers)
      await prisma.lead.create({
        data: {
          listingId: l.id,
          planId: pick(plansForListing).id,
          userId: buyer.id,
          fullName: buyer.fullName,
          phone: buyer.phone,
          message: pick(leadMessages),
          status: pick(['NEW', 'NEW', 'CONTACTED', 'APPROVED'] as const),
        },
      })
      leadCount += 1
    }
    await prisma.listing.update({
      where: { id: l.id },
      data: { leadCount: n },
    })
  }

  const reviewTexts = [
    'Hujjatlar tez rasmiylashtirildi, yashirin toʻlovlar boʻlmadi. Tavsiya qilaman.',
    'Mashina eʼlondagidek holatda. Grafik aniq, har oy eslatma keladi.',
    'Yaxshi xizmat, ammo javob berishlari biroz sekin.',
  ]
  for (const [i, buyer] of buyers.entries()) {
    const profile = arendators[i % arendators.length].profile
    if (!profile) continue
    await prisma.review
      .create({
        data: {
          authorId: buyer.id,
          profileId: profile.id,
          rating: between(4, 5),
          comment: reviewTexts[i % reviewTexts.length],
        },
      })
      .catch(() => {})
  }

  // Profil reytinglarini yangilash
  for (const a of arendators) {
    if (!a.profile) continue
    const agg = await prisma.review.aggregate({
      where: { profileId: a.profile.id, isPublished: true },
      _avg: { rating: true },
      _count: true,
    })
    await prisma.arendatorProfile.update({
      where: { id: a.profile.id },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count,
      },
    })
    await recalcProfileCounters(prisma, a.id)
  }

  console.log(`   ${leadCount} ta ariza, sharhlar va sevimlilar`)

  // ── Yakun ──────────────────────────────────────────────────
  const stats = {
    eʼlonlar: await prisma.listing.count(),
    shartlar: await prisma.rentalPlan.count(),
    grafikQatorlari: await prisma.scheduleItem.count(),
  }
  console.log('\n✅ Seed tugadi:', stats)
  console.log('\n🔑 Demo hisoblar (parol: %s)', DEMO_PASSWORD)
  console.log('   Admin      : %s', admin.phone)
  for (const a of arendators) {
    console.log('   Arendator  : %s  (%s)', a.phone, a.profile?.companyName)
  }
  console.log('   Foydalanuvchi: %s', buyers[0].phone)
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
