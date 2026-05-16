import { z } from 'zod'
import {
  CreateCandidateSchema,
  UpdateCandidateStatusSchema,
  ScheduleInterviewSchema,
  SubmitInterviewResultSchema,
} from './recruitment.schema'

export type CreateCandidateDTO = z.infer<typeof CreateCandidateSchema>
export type UpdateCandidateStatusDTO = z.infer<typeof UpdateCandidateStatusSchema>
export type ScheduleInterviewDTO = z.infer<typeof ScheduleInterviewSchema>
export type SubmitInterviewResultDTO = z.infer<typeof SubmitInterviewResultSchema>
