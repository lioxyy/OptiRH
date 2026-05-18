import { z } from 'zod'

export const UpdateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
})
