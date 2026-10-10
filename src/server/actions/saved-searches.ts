'use server'

import { revalidateLocalized } from '@/i18n/revalidate'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getActionUser } from '@/lib/auth/guards'
import { errorState, fromZodError, successState, type ActionState } from './types'
import { getRequestMessages } from '@/i18n/action'
import { fmt } from '@/i18n/format'

/** Javob matnlari foydalanuvchi tilida */
const msg = async () => (await getRequestMessages()).server

const MAX_SAVED_SEARCHES = 20

/** Saqlashda e'tiborga olinmaydigan (natijaga ta'sir qilmaydigan) parametrlar */
const IGNORED_PARAMS = new Set(['page', 'perPage', 'sort'])

function normalizeQuery(raw: string): string {
  const params = new URLSearchParams(raw.replace(/^\?/, ''))
  const clean = new URLSearchParams()
  for (const [k, v] of [...params.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!IGNORED_PARAMS.has(k) && v.trim()) clean.set(k, v.trim())
  }
  return clean.toString()
}

const saveSchema = z.object({
  name: z.string().trim().min(2, 'Nom kamida 2 ta belgi').max(80),
  query: z.string().max(2000),
  frequency: z.enum(['INSTANT', 'DAILY', 'WEEKLY']).default('INSTANT'),
})

export interface SaveSearchResult {
  requiresAuth?: boolean
}

export async function saveSearchAction(input: {
  name: string
  query: string
  frequency?: 'INSTANT' | 'DAILY' | 'WEEKLY'
}): Promise<ActionState<SaveSearchResult>> {
  const parsed = saveSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  const user = await getCurrentUser()
  if (!user) {
    return { status: 'error', message: (await msg()).savedSearch.loginRequired, data: { requiresAuth: true } }
  }

  const query = normalizeQuery(parsed.data.query)
  if (!query) return errorState((await msg()).savedSearch.needFilter)

  try {
    const existing = await prisma.savedSearch.findFirst({
      where: { userId: user.id, query },
      select: { id: true },
    })
    if (existing) return successState((await msg()).savedSearch.exists)

    const count = await prisma.savedSearch.count({ where: { userId: user.id } })
    if (count >= MAX_SAVED_SEARCHES) {
      return errorState(fmt((await msg()).savedSearch.limit, { max: MAX_SAVED_SEARCHES }))
    }

    await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        query,
        frequency: parsed.data.frequency,
      },
    })
    revalidateLocalized('/kabinet/saqlanganlar')
    return successState((await msg()).savedSearch.saved)
  } catch (error) {
    console.error('saveSearchAction:', error)
    return errorState((await msg()).savedSearch.saveFailed)
  }
}

export async function toggleSavedSearchNotifyAction(
  id: string,
  notify: boolean,
): Promise<ActionState> {
  try {
    const user = await getActionUser()
    await prisma.savedSearch.updateMany({ where: { id, userId: user.id }, data: { notify } })
    revalidateLocalized('/kabinet/saqlanganlar')
    return successState(notify ? (await msg()).savedSearch.notifyOn : (await msg()).savedSearch.notifyOff)
  } catch (error) {
    console.error('toggleSavedSearchNotifyAction:', error)
    return errorState((await msg()).errors.generic)
  }
}

export async function deleteSavedSearchAction(id: string): Promise<ActionState> {
  try {
    const user = await getActionUser()
    await prisma.savedSearch.deleteMany({ where: { id, userId: user.id } })
    revalidateLocalized('/kabinet/saqlanganlar')
    return successState((await msg()).savedSearch.deleted)
  } catch (error) {
    console.error('deleteSavedSearchAction:', error)
    return errorState((await msg()).errors.deleteFailed)
  }
}
