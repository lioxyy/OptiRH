import { z } from 'zod'
import {
  CreateContractSchema,
  ContractParamsSchema
} from './contracts.schema'

export type CreateContractDTO = z.infer<typeof CreateContractSchema>
export type ContractParamsDTO = z.infer<typeof ContractParamsSchema>
