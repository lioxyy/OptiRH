import { z } from 'zod'

export const CreateEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  bonus_amount: z.number().min(0).default(0),
  comments: z.string().optional(),
  type_eval: z.enum(['Employee', 'Candidate']),
  evaluatee_emp_id: z.number().int().positive().optional(),
  evaluatee_cand_id: z.number().int().positive().optional(),
})

export const EvaluationParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const EmployeeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
