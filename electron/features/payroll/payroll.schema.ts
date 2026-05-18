import { z } from 'zod'

export const GeneratePayrollSchema = z.object({
  id_emp: z.number().int().positive(),
  month_year: z.string().regex(/^\d{2}-\d{4}$|^\d{4}-\d{2}$/),
  bonus_amount: z.number().min(0).optional().default(0),
  absence_deductions: z.number().min(0).optional().default(0),
})

export const PayrollParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const UpdatePayrollStatusSchema = z.object({
  status: z.enum(['Validated', 'Paid']),
})
