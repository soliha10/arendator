'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { getActionUserWithRole, getActionUser } from '@/lib/auth/guards'
import { slugify } from '@/lib/utils'
import { deleteImage } from '@/lib/storage'
import { LISTING_ACTIVE_DAYS } from '@/lib/constants'
import { listingSchema } from '@/lib/validation/listing'
import { getRates } from '@/server/exchange'
import {
  recalcListingAggregates,
  recalcProfileCounters,
  syncPlans,
} from '@/server/plan-service'
import { errorState, fromZodError, successState, type ActionState } from './types'

/** Bir xil sarlavhali e'lonlar bo'lsa ham slug takrorlanmasligi uchun */
function buildSlug(title: string): string {
  return `${slugify(title) || 'elon'}-${nanoid(6).toLowerCase()}`
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
    const user = await getActionUserWithRole(['ARENDATOR', 'ADMIN'])
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
      return errorState('Tanlangan model markaga mos kelmadi', {
        modelId: ['Modelni qayta tanlang'],
      })
    }
    if (!region) {
      return errorState('Viloyat topilmadi', { regionId: ['Viloyatni tanlang'] })
    }

    let listingId = data.id ?? null
    let removedImageUrls: string[] = []

    if (listingId) {
      // ── Yangilash ──
      const existing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true, ownerId: true, status: true, slug: true, title: true,
          images: { select: { id: true, url: true } },
        },
      })
      if (!existing) return errorState('Eʼlon topilmadi')
      if (existing.ownerId !== user.id && user.role !== 'ADMIN') {
        return errorState('Bu eʼlonni tahrirlashga ruxsatingiz yoʻq')
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
        await recalcListingAggregates(tx, listingId!)
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
        await recalcListingAggregates(tx, listing.id)
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

    revalidatePath('/kabinet/elonlarim')
    revalidatePath('/elonlar')
    revalidatePath(`/elon/${saved.slug}`)

    return successState(
      data.publish
        ? 'Eʼlon saqlandi va moderatsiyaga yuborildi'
        : 'Qoralama saqlandi',
      saved,
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return errorState('Avtorizatsiya muddati tugadi. Qaytadan kiring.')
    }
    if (error instanceof Error && error.name === 'ForbiddenError') {
      return errorState('Eʼlon joylash uchun arendator hisobi kerak')
    }
    console.error('saveListingAction:', error)
    return errorState('Eʼlonni saqlab boʻlmadi. Qayta urinib koʻring.')
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
    if (!listing) return errorState('Eʼlon topilmadi')
    if (listing.ownerId !== user.id && user.role !== 'ADMIN') {
      return errorState('Ruxsat yoʻq')
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
    revalidatePath('/kabinet/elonlarim')
    revalidatePath('/elonlar')

    const messages = {
      pause: 'Eʼlon vaqtincha toʻxtatildi',
      activate: 'Eʼlon faollashtirildi',
      archive: 'Eʼlon arxivlandi',
      rented: 'Eʼlon "berilgan" deb belgilandi',
    }
    return successState(messages[action])
  } catch (error) {
    console.error('changeListingStatusAction:', error)
    return errorState('Holatni oʻzgartirib boʻlmadi')
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
    if (!listing) return errorState('Eʼlon topilmadi')
    if (listing.ownerId !== user.id && user.role !== 'ADMIN') {
      return errorState('Ruxsat yoʻq')
    }

    await prisma.listing.delete({ where: { id: listingId } })
    await Promise.all(listing.images.map((i) => deleteImage(i.url)))
    await recalcProfileCounters(prisma, listing.ownerId)

    revalidatePath('/kabinet/elonlarim')
    revalidatePath('/elonlar')
    return successState('Eʼlon oʻchirildi')
  } catch (error) {
    console.error('deleteListingAction:', error)
    return errorState('Eʼlonni oʻchirib boʻlmadi')
  }
}
