import { z } from 'zod'

export const CreateLeaveSchema = z.object({
  id_type: z.number().int().positive(),
  date_deb: z.string().datetime(),
  date_fin: z.string().datetime(),
}).refine(data => new Date(data.date_deb) <= new Date(data.date_fin), {
  message: "Start date must be before or equal to end date",
  path: ['date_deb']
})

export const LeaveActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
})

export const LeaveParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const LeaveBalanceQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).default(new Date().getFullYear()),
})
