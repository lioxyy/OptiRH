import { z } from 'zod'

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  date_birth: z.string().min(1),
  address: z.string().optional(),
  date_employment: z.string().min(1),
  id_dept: z.coerce.number().int().positive(),
  supervisor_id: z.coerce.number().int().positive().optional(),
  password: z.string().min(6),
})

export const UpdateAgentSchema = CreateAgentSchema.partial().omit({ password: true })

export const AgentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const AssignDepartmentSchema = z.object({
  id_dept: z.coerce.number().int().positive(),
})

export const TeamMemberBodySchema = z.object({
  emp_id: z.coerce.number().int().positive(),
})

export const TeamMemberParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  empId: z.coerce.number().int().positive(),
})
