import { z } from 'zod'

export const NotificationParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const NotificationQuerySchema = z.object({
  is_read: z.string().optional(),
})
