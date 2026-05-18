import { z } from 'zod'

const BaseFormationSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    location: z.string().optional(),
    date_deb: z.string().min(1),
    duration_days: z.coerce.number().int().positive(),
    id_instructor: z.coerce.number().int().positive().optional(),
    external_instructor: z.string().optional(),
})

export const CreateFormationSchema = BaseFormationSchema.refine(data => data.id_instructor || data.external_instructor, {
    message: "Either a local instructor or an external instructor must be provided",
    path: ["id_instructor"]
})

export const UpdateFormationSchema = BaseFormationSchema.partial()

export const FormationParamsSchema = z.object({ id: z.coerce.number() })

export const AssignInstructorSchema = z.object({ id_instructor: z.coerce.number() })

export const ScheduleFormationSchema = z.object({
    date_deb: z.string().optional(),
    duration_days: z.coerce.number().optional()
})

export const ParticipantBodySchema = z.object({ emp_id: z.coerce.number().int().positive() })

export const ParticipantParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
    empId: z.coerce.number().int().positive(),
})

export type CreateFormationInput = z.infer<typeof CreateFormationSchema>
export type UpdateFormationInput = z.infer<typeof UpdateFormationSchema>
