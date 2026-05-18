import { z } from 'zod'

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  manager_id: z.number().int().positive().optional().nullable(),
  employee_ids: z.array(z.number().int().positive()).optional(),
})

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial()

export const DepartmentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

