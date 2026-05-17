import { z } from 'zod'

const RoleSchema = z.enum(['Admin', 'Agent', 'Employee'])

export const CreateAdminUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  role: RoleSchema,
  id_dept: z.coerce.number().int().positive(),
  supervisor_id: z.coerce.number().int().positive().optional(),
  password: z.string().min(6),
  date_birth: z.string().min(1),
  date_employment: z.string().min(1),
  gender: z.string().optional(),
  address: z.string().optional(),
})

export const UpdateAdminUserSchema = CreateAdminUserSchema.partial().omit({
  password: true,
})

export const UpdateAdminUserPasswordSchema = z.object({
  password: z.string().min(6),
})

export const UpdateAdminUserRoleSchema = z.object({
  role: RoleSchema,
})

export const AdminUserParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
