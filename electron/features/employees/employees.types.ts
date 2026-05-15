import { z } from 'zod'
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
} from './employees.schema'

export type CreateEmployeeDTO = z.infer<typeof CreateEmployeeSchema>
export type UpdateEmployeeDTO = z.infer<typeof UpdateEmployeeSchema>
export type CreateDepartmentDTO = z.infer<typeof CreateDepartmentSchema>
export type UpdateDepartmentDTO = z.infer<typeof UpdateDepartmentSchema>
