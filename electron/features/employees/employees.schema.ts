import { z } from 'zod'

export const CreateEmployeeSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  date_birth: z.string().datetime(),
  address: z.string().optional(),
  date_employment: z.string().datetime(),
  role: z.enum(['Admin', 'Agent', 'Employee']),
  id_dept: z.number().int().positive(),
  supervisor_id: z.number().int().positive().optional(),
  password: z.string().min(6),
})

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial()

export const EmployeeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  manager_id: z.number().int().positive().optional(),
})

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial()

export const DepartmentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
