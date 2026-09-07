import { z } from 'zod'
import { phoneSchema } from './common'

export const leadSchema = z.object({
  listingId: z.string().min(1),
  planId: z.string().optional(),
  fullName: z.string().trim().min(3, 'Ismingizni kiriting').max(80),
  phone: phoneSchema,
  message: z.string().trim().max(1000).optional(),
})

export type LeadInput = z.infer<typeof leadSchema>

export const leadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(['NEW', 'CONTACTED', 'APPROVED', 'REJECTED', 'CANCELLED']),
  ownerNote: z.string().trim().max(1000).optional(),
})

export const reviewSchema = z.object({
  profileId: z.string().min(1),
  listingId: z.string().optional(),
  rating: z.coerce.number().int().min(1, 'Baho qoʻying').max(5),
  comment: z.string().trim().max(1000).optional(),
})
