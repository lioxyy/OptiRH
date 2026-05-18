import { z } from 'zod'

const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[0-9]/, 'Password must contain at least one numeric value')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')

const BaseEmployeeSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  date_birth: z.string().datetime(),
  address: z.string().optional(),
  date_employment: z.string().datetime(),
  role: z.enum(['Admin', 'Agent', 'Employee']),
  id_depts: z.array(z.number().int().positive()),
})

export const CreateEmployeeSchema = BaseEmployeeSchema.extend({
  password: PasswordSchema,
}).superRefine((data, ctx) => {
  const birthDate = new Date(data.date_birth)
  const employmentDate = new Date(data.date_employment)
  const today = new Date()

  // 1. Employee must be at least 18
  const age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  const is18 = age > 18 || (age === 18 && (m > 0 || (m === 0 && today.getDate() >= birthDate.getDate())))

  if (!is18) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Employee must be at least 18 years old",
      path: ["date_birth"],
    })
  }

  // 2. Date of employment <= today's date
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const empDateStart = new Date(employmentDate)
  empDateStart.setHours(0, 0, 0, 0)

  if (empDateStart > todayStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Employment date cannot be in the future",
      path: ["date_employment"],
    })
  }

  // 3. Employee can't have a date of employment where his age is < 18
  const ageAtEmp = employmentDate.getFullYear() - birthDate.getFullYear()
  const mAtEmp = employmentDate.getMonth() - birthDate.getMonth()
  const is18AtEmp = ageAtEmp > 18 || (ageAtEmp === 18 && (mAtEmp > 0 || (mAtEmp === 0 && employmentDate.getDate() >= birthDate.getDate())))

  if (!is18AtEmp) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Employee must have been at least 18 at the time of employment",
      path: ["date_employment"],
    })
  }
})

export const UpdateEmployeeSchema = BaseEmployeeSchema.extend({
  password: PasswordSchema.optional(),
}).partial()

export const EmployeeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

