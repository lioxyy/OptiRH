import { z } from 'zod'

export const CreateCandidateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  date_birth: z.string().datetime().optional(),
  address: z.string().optional(),
  post_applied: z.string().optional(),
  id_dept: z.number().int().positive().optional(),
  agent_in_charge: z.number().int().positive().optional(),
})

export const UpdateCandidateStatusSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Accepted', 'Rejected']),
})

export const ScheduleInterviewSchema = z.object({
  id_cand: z.number().int().positive(),
  date_heure: z.string().datetime(),
  id_agent: z.number().int().positive(),
})

export const SubmitInterviewResultSchema = z.object({
  notes: z.string().optional(),
  score: z.number().int().min(0).max(100),
})

export const CandidateParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const InterviewParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
