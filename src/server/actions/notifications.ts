'use server'

import { revalidateLocalized } from '@/i18n/revalidate'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getActionUser } from '@/lib/auth/guards'
import { DEFAULT_PREFS, readPrefs, type NotificationPrefs } from '@/server/notifications'
import { errorState, successState, type ActionState } from './types'
import { getRequestMessages } from '@/i18n/action'
import { fmt } from '@/i18n/format'

/** Javob matnlari foydalanuvchi tilida */
const msg = async () => (await getRequestMessages()).server

function revalidate() {
  revalidateLocalized('/kabinet/xabarnomalar')
  // Header'dagi qo'ng'iroq raqami barcha sahifalarda
  revalidateLocalized('/', 'layout')
}

/** Bitta bildirishnomani o'qilgan deb belgilaydi */
export async function markNotificationReadAction(id: string): Promise<ActionState> {
  try {
    const user = await getActionUser()
    await prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
    revalidate()
    return successState()
  } catch (error) {
    console.error('markNotificationReadAction:', error)
    return errorState((await msg()).errors.generic)
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionState> {
  try {
    const user = await getActionUser()
    const { count } = await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
    revalidate()
    return successState(
      count > 0 ? fmt((await msg()).notifications.readAll, { n: count }) : (await msg()).notifications.noneUnread,
    )
  } catch (error) {
    console.error('markAllNotificationsReadAction:', error)
    return errorState((await msg()).errors.generic)
  }
}

export async function deleteNotificationAction(id: string): Promise<ActionState> {
  try {
    const user = await getActionUser()
    await prisma.notification.deleteMany({ where: { id, userId: user.id } })
    revalidate()
    return successState()
  } catch (error) {
    console.error('deleteNotificationAction:', error)
    return errorState((await msg()).errors.deleteFailed)
  }
}

const prefKeys = Object.keys(DEFAULT_PREFS) as [keyof NotificationPrefs, ...(keyof NotificationPrefs)[]]
const prefUpdateSchema = z.object({
  key: z.enum(prefKeys),
  value: z.boolean(),
})

/** Bitta sozlamani almashtiradi (toggle) — qolganlari saqlanib qoladi */
export async function updateNotificationPrefAction(
  key: keyof NotificationPrefs,
  value: boolean,
): Promise<ActionState<NotificationPrefs>> {
  const parsed = prefUpdateSchema.safeParse({ key, value })
  if (!parsed.success) return errorState((await msg()).notifications.prefInvalid)

  try {
    const user = await getActionUser()
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { notificationPrefs: true },
    })
    const next: NotificationPrefs = { ...readPrefs(row.notificationPrefs), [key]: value }
    await prisma.user.update({
      where: { id: user.id },
      data: { notificationPrefs: next as unknown as Prisma.InputJsonValue },
    })
    revalidateLocalized('/kabinet/xabarnomalar')
    return successState((await msg()).notifications.prefSaved, next)
  } catch (error) {
    console.error('updateNotificationPrefAction:', error)
    return errorState((await msg()).notifications.prefFailed)
  }
}
