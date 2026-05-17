export type Role = 'Admin' | 'Agent' | 'Employee'

export type AdminUser = {
  id_emp: number
  name: string
  email: string
  phone?: string | null
  role: Role
  id_dept: number
  supervisor_id?: number | null
  date_birth: string
  date_employment: string
  gender?: string | null
  address?: string | null
  department?: {
    id_dept: number
    name: string
  } | null
  supervisor?: {
    id_emp: number
    name: string
  } | null
  permissions: string[]
}

export type AdminUserPayload = {
  name: string
  email: string
  phone?: string
  role: Role
  id_dept: number
  supervisor_id?: number
  password: string
  date_birth: string
  date_employment: string
  gender?: string
  address?: string
}

export type AdminUserUpdatePayload = Partial<Omit<AdminUserPayload, 'password'>>

export type PermissionsMatrix = {
  roles: Role[]
  matrix: Record<Role, string[]>
}
