export interface CreateFormationDTO {
    name: string
    description?: string
    location?: string
    date_deb: string | Date
    duration_days: number
    id_instructor?: number
    external_instructor?: string
    participant_ids?: number[]
}

export interface UpdateFormationDTO extends Partial<CreateFormationDTO> { }
