import { z } from 'zod'

export const LogManualAbsenceSchema = z.object({
  id_emp: z.coerce.number().int().positive(),
  date_absence: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  id_type: z.coerce.number().int().positive().nullable().optional(),
})

export const UploadJustificationSchema = z.object({
  fileBase64: z.string().min(1),
  originalFileName: z.string().min(1).max(255),
})

export const ReviewJustificationSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  reject_reason: z.string().max(500).optional().nullable(),
})
