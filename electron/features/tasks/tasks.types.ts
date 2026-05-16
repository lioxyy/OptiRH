import { z } from 'zod'
import { CreateTaskSchema, UpdateTaskSchema } from './tasks.schema'

export type CreateTaskDTO = z.infer<typeof CreateTaskSchema>
export type UpdateTaskDTO = z.infer<typeof UpdateTaskSchema>
