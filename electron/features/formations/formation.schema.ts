import { z } from 'zod'

export const CreateFormationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  date_deb: z.string().min(1),
  duration_days: z.coerce.number().int().positive(),
  instructor_id: z.coerce.number().int().positive(),
})

export const UpdateFormationSchema = CreateFormationSchema.partial()

export const FormationParamsSchema = z.object({ id: z.coerce.number() })

export const AssignInstructorSchema = z.object({ instructor_id: z.coerce.number() })

export const ScheduleFormationSchema = z.object({ date_deb: z.string().optional(), duration_days: z.coerce.number().optional() })

export const ParticipantBodySchema = z.object({ emp_id: z.coerce.number().int().positive() })

export const ParticipantParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  empId: z.coerce.number().int().positive(),
})

export type CreateFormationInput = z.infer<typeof CreateFormationSchema>
export type UpdateFormationInput = z.infer<typeof UpdateFormationSchema>
