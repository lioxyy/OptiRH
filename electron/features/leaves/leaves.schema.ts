import { z } from 'zod'

export const LeaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  default_days: z.number().int().nonnegative(),
  is_cumulative: z.boolean().default(false),
})

export const LeaveRequestSchema = z.object({
  id_type: z.coerce.number().int().positive(),
  date_deb: z.string(),
  date_fin: z.string(),
})

export const UpdateLeaveStatusSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected']),
})
