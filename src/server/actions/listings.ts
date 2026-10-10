'use server'

import { revalidateLocalized } from '@/i18n/revalidate'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { getActionUser } from '@/lib/auth/guards'
import { slugify } from '@/lib/utils'
import { deleteImage } from '@/lib/storage'
import { LISTING_ACTIVE_DAYS } from '@/lib/constants'
import { listingSchema, type ListingOutput } from '@/lib/validation/listing'
import { getRates } from '@/server/exchange'
import {
  recalcListingAggregates,
  recalcProfileCounters,
  syncPlans,
} from '@/server/plan-service'
import { recordPriceChange } from '@/server/notifications'
import { errorState, fromZodError, successState, type ActionState } from './types'
import { getRequestMessages } from '@/i18n/action'

/** Javob matnlari foydalanuvchi tilida */
const msg = async () => (await getRequestMessages()).server

/** Bir xil sarlavhali e'lonlar bo'lsa ham slug takrorlanmasligi uchun */
function buildSlug(title: string): string {
  return `${slugify(title) || 'elon'}-${nanoid(6).toLowerCase()}`
}

/** Dizayn v2 maydonlari — yaratish va yangilashda bir xil */
function v2Fields(data: ListingOutput) {
  return {
    telegram: data.telegram ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    features: data.features,
    hasCashSale: data.hasCashSale,
    cashPrice: data.hasCashSale ? (data.cashPrice ?? null) : null,
    cashCurrency: data.cashCurrency,
    isNegotiable: data.isNegotiable,
  }
}

export interface SavedListing {
  id: string
  slug: string
  status: string
}

/**
 * E'lonni yaratadi yoki yangilaydi.
 * Rasm, to'lov shartlari va grafik — hammasi bitta tranzaksiyada.
 */
export async function saveListingAction(
  input: unknown,
): Promise<ActionState<SavedListing>> {
  const parsed = listingSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  const data = parsed.data

  try {
    // Jismoniy shaxs ham e'lon bera oladi — birinchi e'londa unga
    // e'lon beruvchi (ARENDATOR) huquqlari ochiladi.
    const user = await getActionUser()
    if (user.role === 'USER') {
      await prisma.user.update({ where: { id: user.id }, data: { role: 'ARENDATOR' } })
    }
    const rates = await getRates()

    // Ma'lumotnoma bog'liqliklarini tekshiramiz
    const [model, region] = await Promise.all([
      prisma.carModel.findUnique({
        where: { id: data.modelId },
        select: { id: true, brandId: true },
      }),
      prisma.region.findUnique({ where: { id: data.regionId }, select: { id: true } }),
    ])
    if (!model || model.brandId !== data.brandId) {
      return errorState((await msg()).listing.modelMismatch, {
        modelId: [(await msg()).listing.modelReselect],
      })
    }
    if (!region) {
      return errorState((await msg()).listing.regionNotFound, { regionId: ['Viloyatni tanlang'] })
    }

    let listingId = data.id ?? null
    let removedImageUrls: string[] = []

    if (listingId) {
      // ── Yangilash ──
      const existing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true, ownerId: true, status: true, slug: true, title: true,
          carPriceUzs: true,
          images: { select: { id: true, url: true } },
        },
      })
      if (!existing) return errorState((await msg()).errors.listingNotFound)
      if (existing.ownerId !== user.id && user.role !== 'ADMIN') {
        return errorState((await msg()).listing.noEditRights)
      }

      const incomingUrls = new Set(data.images.map((i) => i.url))
      removedImageUrls = existing.images
        .filter((i) => !incomingUrls.has(i.url))
        .map((i) => i.url)

      // Chop etilgan e'lon tahrirlansa, qayta moderatsiyaga tushadi
      const nextStatus = data.publish
        ? existing.status === 'ACTIVE'
          ? 'ACTIVE'
          : 'PENDING'
        : 'DRAFT'

      await prisma.$transaction(async (tx) => {
        await tx.listingImage.deleteMany({ where: { listingId: listingId! } })

        await tx.listing.update({
          where: { id: listingId! },
          data: {
            title: data.title,
            description: data.description ?? null,
            brandId: data.brandId,
            modelId: data.modelId,
            year: data.year,
            bodyType: data.bodyType,
            transmission: data.transmission,
            fuelType: data.fuelType,
            driveType: data.driveType,
            engineVolume: data.engineVolume ?? null,
            color: data.color ?? null,
            mileage: data.mileage,
            condition: data.condition,
            seats: data.seats,
            regionId: data.regionId,
            address: data.address ?? null,
            contactPhone: data.contactPhone,
            contactName: data.contactName ?? null,
            ...v2Fields(data),
            status: nextStatus,
            rejectReason: null,
            images: {
              create: data.images.map((img, i) => ({
                url: img.url,
                width: img.width ?? null,
                height: img.height ?? null,
                blurDataUrl: img.blurDataUrl ?? null,
                position: i,
                isCover: i === 0,
              })),
            },
          },
        })

        await syncPlans(tx, listingId!, data.plans, rates)
        await recalcListingAggregates(tx, listingId!, rates)

        const after = await tx.listing.findUniqueOrThrow({
          where: { id: listingId! },
          select: { carPriceUzs: true, minMonthlyPaymentUzs: true },
        })
        await recordPriceChange(
          tx,
          { id: existing.id, slug: existing.slug, title: data.title, status: nextStatus },
          existing.carPriceUzs === null ? null : Number(existing.carPriceUzs),
          after.carPriceUzs === null ? null : Number(after.carPriceUzs),
          after.minMonthlyPaymentUzs === null ? null : Number(after.minMonthlyPaymentUzs),
        )
      })
    } else {
      // ── Yaratish ──
      const status = data.publish ? 'PENDING' : 'DRAFT'

      const created = await prisma.$transaction(async (tx) => {
        const listing = await tx.listing.create({
          data: {
            slug: buildSlug(data.title),
            ownerId: user.id,
            title: data.title,
            description: data.description ?? null,
            brandId: data.brandId,
            modelId: data.modelId,
            year: data.year,
            bodyType: data.bodyType,
            transmission: data.transmission,
            fuelType: data.fuelType,
            driveType: data.driveType,
            engineVolume: data.engineVolume ?? null,
            color: data.color ?? null,
            mileage: data.mileage,
            condition: data.condition,
            seats: data.seats,
            regionId: data.regionId,
            address: data.address ?? null,
            contactPhone: data.contactPhone,
            contactName: data.contactName ?? null,
            ...v2Fields(data),
            status,
            images: {
              create: data.images.map((img, i) => ({
                url: img.url,
                width: img.width ?? null,
                height: img.height ?? null,
                blurDataUrl: img.blurDataUrl ?? null,
                position: i,
                isCover: i === 0,
              })),
            },
          },
          select: { id: true },
        })

        await syncPlans(tx, listing.id, data.plans, rates)
        await recalcListingAggregates(tx, listing.id, rates)

        // Narx tarixining birinchi nuqtasi
        const after = await tx.listing.findUniqueOrThrow({
          where: { id: listing.id },
          select: { carPriceUzs: true, minMonthlyPaymentUzs: true },
        })
        if (after.carPriceUzs !== null) {
          await tx.priceHistory.create({
            data: {
              listingId: listing.id,
              priceUzs: after.carPriceUzs,
              monthlyUzs: after.minMonthlyPaymentUzs,
            },
          })
        }
        return listing
      })

      listingId = created.id
    }

    // Endi kerak bo'lmagan rasm fayllarini o'chiramiz (tranzaksiyadan tashqarida)
    await Promise.all(removedImageUrls.map((url) => deleteImage(url)))
    await recalcProfileCounters(prisma, user.id)

    const saved = await prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
      select: { id: true, slug: true, status: true },
    })

    revalidateLocalized('/kabinet/elonlarim')
    revalidateLocalized('/elonlar')
    revalidateLocalized(`/elon/${saved.slug}`)

    return successState(
      data.publish
        ? (await msg()).listing.saved
        : (await msg()).listing.draftSaved,
      saved,
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return errorState((await msg()).errors.authExpired)
    }
    console.error('saveListingAction:', error)
    return errorState((await msg()).listing.saveFailed)
  }
}

/** E'lon holatini o'zgartirish: to'xtatish, qayta yoqish, arxivlash */
export async function changeListingStatusAction(
  listingId: string,
  action: 'pause' | 'activate' | 'archive' | 'rented',
): Promise<ActionState> {
  try {
    const user = await getActionUser()
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true, status: true, publishedAt: true },
    })
    if (!listing) return errorState((await msg()).errors.listingNotFound)
    if (listing.ownerId !== user.id && user.role !== 'ADMIN') {
      return errorState((await msg()).errors.forbidden)
    }

    // Rad etilgan e'lon qayta yoqilsa, avval moderatsiyadan o'tadi
    const nextStatus =
      action === 'activate' && listing.status === 'REJECTED'
        ? 'PENDING'
        : ({ pause: 'PAUSED', activate: 'ACTIVE', archive: 'ARCHIVED', rented: 'RENTED' } as const)[
            action
          ]

    await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: nextStatus,
        // Birinchi marta chop etilayotgan bo'lsa, sanalarni belgilaymiz
        ...(nextStatus === 'ACTIVE' && !listing.publishedAt
          ? {
              publishedAt: new Date(),
              expiresAt: new Date(Date.now() + LISTING_ACTIVE_DAYS * 86_400_000),
            }
          : {}),
      },
    })

    await recalcProfileCounters(prisma, listing.ownerId)
    revalidateLocalized('/kabinet/elonlarim')
    revalidateLocalized('/elonlar')

    const t = (await msg()).listing
    const messages = {
      pause: t.paused,
      activate: t.activated,
      archive: t.archived,
      rented: t.rented,
    }
    return successState(messages[action])
  } catch (error) {
    console.error('changeListingStatusAction:', error)
    return errorState((await msg()).listing.statusFailed)
  }
}

export async function deleteListingAction(
  listingId: string,
): Promise<ActionState> {
  try {
    const user = await getActionUser()
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        ownerId: true,
        images: { select: { url: true } },
      },
    })
    if (!listing) return errorState((await msg()).errors.listingNotFound)
    if (listing.ownerId !== user.id && user.role !== 'ADMIN') {
      return errorState((await msg()).errors.forbidden)
    }

    await prisma.listing.delete({ where: { id: listingId } })
    await Promise.all(listing.images.map((i) => deleteImage(i.url)))
    await recalcProfileCounters(prisma, listing.ownerId)

    revalidateLocalized('/kabinet/elonlarim')
    revalidateLocalized('/elonlar')
    return successState((await msg()).listing.deleted)
  } catch (error) {
    console.error('deleteListingAction:', error)
    return errorState((await msg()).listing.deleteFailed)
  }
}

/**
 * "Raqamni ko'rsatish" bosilganda hisoblagich oshadi — e'lon egasi
 * kabinetda nechta xaridor qiziqqanini ko'radi. Raqamning o'zi qaytariladi,
 * shuning uchun u sahifa HTML'ida ochiq turmaydi (botlardan himoya).
 */
export async function revealPhoneAction(
  listingId: string,
): Promise<{ ok: boolean; phone?: string; telegram?: string | null }> {
  try {
    const listing = await prisma.listing.update({
      where: { id: listingId, status: 'ACTIVE' },
      data: { phoneRevealCount: { increment: 1 } },
      select: { contactPhone: true, telegram: true },
    })
    return { ok: true, phone: listing.contactPhone, telegram: listing.telegram }
  } catch {
    return { ok: false }
  }
}
