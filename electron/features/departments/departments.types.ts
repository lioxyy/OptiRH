import { z } from 'zod'
import {
  CreateDepartmentSchema,
  DepartmentParamsSchema,
} from './departments.schema'

export type CreateDepartmentDTO = z.infer<typeof CreateDepartmentSchema>
export type UpdateDepartmentDTO = Partial<CreateDepartmentDTO>
export type DepartmentParamsDTO = z.infer<typeof DepartmentParamsSchema>
