import { z } from 'zod'

export const AuditQuerySchema = z.object({
  target_model: z.string().optional(),
  actor_id: z.coerce.number().int().positive().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
})
