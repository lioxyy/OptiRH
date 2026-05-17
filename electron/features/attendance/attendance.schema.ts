import { z } from 'zod'

export const ClockInOutSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
})

export const ManualOverrideSchema = z.object({
  id_emp: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  clock_in: z.string().datetime({ offset: true }).nullable().optional(),
  clock_out: z.string().datetime({ offset: true }).nullable().optional(),
  status: z.enum(['Present', 'Late', 'Absent', 'Half-Day']),
  notes: z.string().max(500).optional().nullable(),
})
