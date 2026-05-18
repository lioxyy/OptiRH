import { z } from 'zod'
import {
    CreateEvaluationSchema,
    CreateCampaignSchema,
    CreateCriteriaSchema
} from './evaluations.schema'

export type CreateEvaluationDTO = z.infer<typeof CreateEvaluationSchema>
export type CreateCampaignDTO = z.infer<typeof CreateCampaignSchema>
export type CreateCriteriaDTO = z.infer<typeof CreateCriteriaSchema>
