import { z } from 'zod'
import { CreateEvaluationSchema } from './evaluations.schema'

export type CreateEvaluationDTO = z.infer<typeof CreateEvaluationSchema>
