import { z } from 'zod'

export const GeneratePayrollSchema = z.object({
  id_emp: z.coerce.number().int().positive(),
  month_year: z.string().regex(/^\d{2}-\d{4}$/, 'Must be in MM-YYYY format'),
})

export const ValidatePayrollSchema = z.object({
  status: z.enum(['Validated', 'Paid']),
})
