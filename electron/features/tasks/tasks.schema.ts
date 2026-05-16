import { z } from 'zod'

export const CreateTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  date_deb: z.string().datetime(),
  date_fin: z.string().datetime(),
  assigned_to: z.number().int().positive(),
})

export const UpdateTaskSchema = z.object({
  status: z.enum(['To Do', 'Doing', 'Done']),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  date_deb: z.string().datetime().optional(),
  date_fin: z.string().datetime().optional(),
  assigned_to: z.number().int().positive().optional(),
})

export const TaskParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
