import { z } from 'zod'
import {
  CreateLeaveSchema,
  LeaveActionSchema,
  LeaveParamsSchema,
  LeaveBalanceQuerySchema
} from './leave.schema'

export type CreateLeaveDTO = z.infer<typeof CreateLeaveSchema>
export type LeaveActionDTO = z.infer<typeof LeaveActionSchema>
export type LeaveParamsDTO = z.infer<typeof LeaveParamsSchema>
export type LeaveBalanceQueryDTO = z.infer<typeof LeaveBalanceQuerySchema>
