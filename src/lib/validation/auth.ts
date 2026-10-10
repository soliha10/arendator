import { z } from 'zod'
import { passwordSchema, phoneSchema } from './common'

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, 'Ism-familiyangizni toʻliq kiriting')
      .max(80, 'Juda uzun'),
    phone: phoneSchema,
    email: z
      .union([z.literal(''), z.email('Notoʻgʻri email manzil')])
      .transform((v) => (v === '' ? undefined : v))
      .optional(),
    password: passwordSchema,
    /** Jismoniy shaxs — xaridor; yuridik — diler/avtosalon (ARENDATOR roli + profil) */
    accountType: z.enum(['INDIVIDUAL', 'BUSINESS']).default('INDIVIDUAL'),
    companyName: z.string().trim().max(120).optional(),
    next: z.string().optional(),
    acceptTerms: z
      .union([z.boolean(), z.literal('on')])
      .transform((v) => v === true || v === 'on')
      .refine((v) => v, { message: 'Shartlarga rozilik bildiring' }),
  })
  .refine(
    (data) =>
      data.accountType !== 'BUSINESS' ||
      (data.companyName !== undefined && data.companyName.length >= 2),
    {
      message: 'Avtosalon yoki kompaniya nomini kiriting',
      path: ['companyName'],
    },
  )

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Parolni kiriting'),
  next: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Joriy parolni kiriting'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, 'Ism-familiyani kiriting').max(80),
  email: z
    .union([z.literal(''), z.email('Notoʻgʻri email manzil')])
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
  avatarUrl: z.string().optional(),
})

export const arendatorProfileSchema = z.object({
  companyName: z.string().trim().min(2, 'Nomni kiriting').max(120),
  legalName: z.string().trim().max(160).optional(),
  inn: z
    .union([z.literal(''), z.string().regex(/^\d{9}$/, 'STIR 9 ta raqamdan iborat')])
    .optional(),
  about: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(200).optional(),
  regionId: z.string().optional(),
  website: z.union([z.literal(''), z.url('Notoʻgʻri havola')]).optional(),
  telegram: z.string().trim().max(64).optional(),
  instagram: z.string().trim().max(64).optional(),
  workingHours: z.string().trim().max(120).optional(),
  logoUrl: z.string().optional(),
})
