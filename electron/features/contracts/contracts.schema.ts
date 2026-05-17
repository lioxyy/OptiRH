import { z } from 'zod'

export const CreateContractSchema = z.object({
  type: z.string().min(1).max(50),
  date_deb: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // Matches datetime or YYYY-MM-DD
  date_fin: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  salaire_base: z.coerce.number().positive(),
  id_emp: z.coerce.number().int().positive(),
})
