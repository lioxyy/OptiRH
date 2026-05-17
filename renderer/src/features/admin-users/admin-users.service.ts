import { api } from '@/lib/api'
import type { AdminUser, AdminUserPayload, AdminUserUpdatePayload, PermissionsMatrix, Role } from './types'

type EmployeeApiRow = {
  id_emp: number
  name: string
  email: string
  phone?: string | null
  role: Role
  id_dept: number
  date_birth?: string
  date_employment?: string
  gender?: string | null
  address?: string | null
  department?: { id_dept: number; name: string } | null
  supervisor?: { id_emp: number; name: string } | null
}

const permissionsByRole: Record<Role, string[]> = {
  Admin: ['users:create', 'users:read', 'users:update', 'users:delete', 'roles:manage', 'permissions:manage', 'departments:manage', 'audit:read'],
  Agent: ['employees:read-department', 'recruitment:manage', 'contracts:read-write'],
  Employee: ['profile:read', 'profile:update-self'],
}

function rolePermissions(role: Role) {
  return permissionsByRole[role] ?? []
}

function mapEmployeeRow(user: EmployeeApiRow): AdminUser {
  return {
    id_emp: user.id_emp,
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
    id_dept: user.id_dept,
    supervisor_id: user.supervisor?.id_emp ?? null,
    date_birth: user.date_birth ?? '',
    date_employment: user.date_employment ?? '',
    gender: user.gender ?? '',
    address: user.address ?? '',
    department: user.department ?? null,
    supervisor: user.supervisor ?? null,
    permissions: rolePermissions(user.role),
  }
}

export const adminUsersService = {
  async listUsers(): Promise<AdminUser[]> {
    try {
      const res = await api.get('/api/admin-users')
      const rows = res.data.data as AdminUser[]
      if (Array.isArray(rows) && rows.length > 0) return rows
    } catch {
      // fall through to the shared employees endpoint
    }

    const fallback = await api.get('/api/employees')
    return (fallback.data.data as EmployeeApiRow[]).map(mapEmployeeRow)
  },

  async getUser(id: number): Promise<AdminUser> {
    const res = await api.get(`/api/admin-users/${id}`)
    return res.data.data
  },

  async createUser(payload: AdminUserPayload): Promise<AdminUser> {
    const res = await api.post('/api/admin-users', payload)
    return res.data.data
  },

  async updateUser(id: number, payload: AdminUserUpdatePayload): Promise<AdminUser> {
    const res = await api.patch(`/api/admin-users/${id}`, payload)
    return res.data.data
  },

  async updateRole(id: number, role: Role): Promise<AdminUser> {
    const res = await api.patch(`/api/admin-users/${id}/role`, { role })
    return res.data.data
  },

  async resetPassword(id: number, password: string): Promise<AdminUser> {
    const res = await api.patch(`/api/admin-users/${id}/password`, { password })
    return res.data.data
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/api/admin-users/${id}`)
  },

  async getPermissionsMatrix(): Promise<PermissionsMatrix> {
    const res = await api.get('/api/admin-users/permissions')
    return res.data.data
  },
}
