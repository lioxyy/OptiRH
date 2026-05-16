import { z } from 'zod'

export const CreateContractSchema = z.object({
  id_emp: z.number().int().positive(),
  type: z.string().min(1),
  date_deb: z.string().datetime(),
  date_fin: z.string().datetime().optional().nullable(),
  salaire_base: z.number().positive(),
}).refine(data => {
  if (data.date_fin) {
    return new Date(data.date_deb) <= new Date(data.date_fin)
  }
  return true
}, {
  message: "Start date must be before or equal to end date",
  path: ['date_deb']
})

export const ContractParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
