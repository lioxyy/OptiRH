import { z } from 'zod'
import { GeneratePayrollSchema, UpdatePayrollStatusSchema } from './payroll.schema'

export type GeneratePayrollDTO = z.infer<typeof GeneratePayrollSchema>
export type UpdatePayrollStatusDTO = z.infer<typeof UpdatePayrollStatusSchema>
