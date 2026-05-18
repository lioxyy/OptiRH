import { z } from 'zod'
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
} from './employees.schema'

export type CreateEmployeeDTO = z.infer<typeof CreateEmployeeSchema>
export type UpdateEmployeeDTO = z.infer<typeof UpdateEmployeeSchema>

