import { z } from 'zod'

export const CreateCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Type is required'),
  date_start: z.string().min(1, 'Start date is required'),
  date_end: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
})

export const CreateCriteriaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  weight: z.number().min(1, 'Weight must be at least 1'),
  max_score: z.number().min(1, 'Max score must be at least 1'),
})

export const CreateEvaluationSchema = z.object({
  type_eval: z.enum(['Employee', 'Candidate']),
  evaluatee_emp_id: z.number().optional(),
  evaluatee_cand_id: z.number().optional(),
  campaign_id: z.number().optional(),
  bonus_amount: z.number().optional(),
  comments: z.string().optional(),
  scores: z.array(z.object({
    criteria_id: z.number(),
    score: z.number(),
    comment: z.string().optional(),
  })).min(1, 'At least one score is required'),
})

export const EvaluationParamsSchema = z.object({
  id: z.string().transform(Number)
})
