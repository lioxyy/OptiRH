import { z } from 'zod'

export const SubmitMassroufSchema = z.object({
  amount: z.coerce.number().positive(),
})

export const ReviewMassroufSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
})
