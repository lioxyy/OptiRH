export type Formation = {
  id_formation: number
  name: string
  description?: string
  location?: string
  date_deb: string
  duration_days: number
  instructor_id: number
  instructor?: { id_emp: number, name: string } | null
}

export type CreateFormationPayload = {
  name: string
  description?: string
  location?: string
  date_deb: string
  duration_days: number
  instructor_id: number
}

export type UpdateFormationPayload = Partial<CreateFormationPayload>

export type EmployeeRef = {
  id_emp: number
  name: string
  role: string
}

export type Participant = {
  id_emp: number
  name: string
  email: string
  role: string
}
