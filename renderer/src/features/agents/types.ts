export type Agent = {
  id_emp: number
  name: string
  email: string
  phone?: string | null
  gender?: string | null
  address?: string | null
  date_birth: string
  date_employment: string
  role: 'Agent'
  id_dept: number
  supervisor_id?: number | null
  department?: { id_dept: number; name: string } | null
  supervisor?: { id_emp: number; name: string } | null
  subordinates?: TeamMember[]
}

export type TeamMember = {
  id_emp: number
  name: string
  email: string
  role: string
  department?: { id_dept: number; name: string } | null
}

export type CreateAgentPayload = {
  name: string
  email: string
  phone?: string
  gender?: string
  address?: string
  date_birth: string
  date_employment: string
  id_dept: number
  supervisor_id?: number
  password: string
}

export type UpdateAgentPayload = Partial<Omit<CreateAgentPayload, 'password'>>

export type Department = {
  id_dept: number
  name: string
  description?: string | null
}
