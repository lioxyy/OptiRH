export type CreateFormationDTO = {
    name: string
    description?: string
    location?: string
    date_deb: string
    duration_days: number
    instructor_id: number
}

export type UpdateFormationDTO = Partial<CreateFormationDTO>
