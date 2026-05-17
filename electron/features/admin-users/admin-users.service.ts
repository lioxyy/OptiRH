import bcrypt from 'bcryptjs'
import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import type { RequestUser } from '../../middleware/authenticate'

type Role = 'Admin' | 'Agent' | 'Employee'

type CreateUserInput = {
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

type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>>

const permissionsByRole: Record<Role, string[]> = {
  Admin: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'roles:manage',
    'permissions:manage',
    'departments:manage',
    'audit:read',
  ],
  Agent: [
    'employees:read-department',
    'recruitment:manage',
    'contracts:read-write',
  ],
  Employee: [
    'profile:read',
    'profile:update-self',
  ],
}

function ensureRolePermissions(role: Role) {
  return permissionsByRole[role] ?? []
}

async function getAdminCount() {
  return prisma.employee.count({ where: { role: 'Admin' } })
}

async function ensureCanDemoteOrDeleteAdmin(targetId: number) {
  const target = await prisma.employee.findUnique({ where: { id_emp: targetId } })
  if (!target) throw new AppError('EMPLOYEE_NOT_FOUND', 404)
  if (target.role !== 'Admin') return target

  const adminCount = await getAdminCount()
  if (adminCount <= 1) {
    throw new AppError('CONFLICT', 409, { reason: 'LAST_ADMIN_REQUIRED' })
  }

  return target
}

export async function getPermissionsMatrix() {
  return {
    roles: Object.keys(permissionsByRole),
    matrix: permissionsByRole,
  }
}

export async function listAdminUsers() {
  const users = await prisma.employee.findMany({
    include: {
      department: { select: { id_dept: true, name: true } },
      supervisor: { select: { id_emp: true, name: true } },
    },
    orderBy: { id_emp: 'asc' },
  })

  return users.map((user) => ({
    ...user,
    permissions: ensureRolePermissions(user.role as Role),
  }))
}

export async function getAdminUserById(id: number) {
  const user = await prisma.employee.findUnique({
    where: { id_emp: id },
    include: {
      department: { select: { id_dept: true, name: true } },
      supervisor: { select: { id_emp: true, name: true } },
    },
  })

  if (!user) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  return {
    ...user,
    permissions: ensureRolePermissions(user.role as Role),
  }
}

export async function createAdminUser(data: CreateUserInput, actorId: number) {
  const existing = await prisma.employee.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError('EMAIL_ALREADY_EXISTS', 409)

  const password_hash = await bcrypt.hash(data.password, 10)

  return prisma.$transaction(async (tx) => {
    const created = await tx.employee.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        id_dept: data.id_dept,
        supervisor_id: data.supervisor_id,
        password_hash,
        date_birth: new Date(data.date_birth),
        date_employment: new Date(data.date_employment),
        gender: data.gender,
        address: data.address,
      },
      include: {
        department: { select: { id_dept: true, name: true } },
        supervisor: { select: { id_emp: true, name: true } },
      },
    })

    await writeAuditLog(tx, actorId, 'CREATE', 'Employee', created.id_emp, created)

    return {
      ...created,
      permissions: ensureRolePermissions(created.role as Role),
    }
  })
}

export async function updateAdminUser(id: number, patch: UpdateUserInput, actor: RequestUser) {
  const existing = await prisma.employee.findUnique({ where: { id_emp: id } })
  if (!existing) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  if (actor.id_emp === id && patch.role && patch.role !== 'Admin') {
    throw new AppError('FORBIDDEN', 403, { reason: 'SELF_ROLE_CHANGE_FORBIDDEN' })
  }

  if (patch.role && patch.role !== 'Admin') {
    await ensureCanDemoteOrDeleteAdmin(id)
  }

  if (patch.email && patch.email !== existing.email) {
    const conflict = await prisma.employee.findUnique({ where: { email: patch.email } })
    if (conflict) throw new AppError('EMAIL_ALREADY_EXISTS', 409)
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id_emp: id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.email !== undefined ? { email: patch.email } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.role !== undefined ? { role: patch.role } : {}),
        ...(patch.id_dept !== undefined ? { id_dept: patch.id_dept } : {}),
        ...(patch.supervisor_id !== undefined ? { supervisor_id: patch.supervisor_id } : {}),
        ...(patch.date_birth !== undefined ? { date_birth: new Date(patch.date_birth) } : {}),
        ...(patch.date_employment !== undefined ? { date_employment: new Date(patch.date_employment) } : {}),
        ...(patch.gender !== undefined ? { gender: patch.gender } : {}),
        ...(patch.address !== undefined ? { address: patch.address } : {}),
      },
      include: {
        department: { select: { id_dept: true, name: true } },
        supervisor: { select: { id_emp: true, name: true } },
      },
    })

    await writeAuditLog(tx, actor.id_emp, 'UPDATE', 'Employee', id, updated)

    return {
      ...updated,
      permissions: ensureRolePermissions(updated.role as Role),
    }
  })
}

export async function updateAdminUserRole(id: number, role: Role, actor: RequestUser) {
  return updateAdminUser(id, { role }, actor)
}

export async function updateAdminUserPassword(id: number, password: string, actor: RequestUser) {
  const existing = await prisma.employee.findUnique({ where: { id_emp: id } })
  if (!existing) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  const password_hash = await bcrypt.hash(password, 10)

  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id_emp: id },
      data: { password_hash },
      include: {
        department: { select: { id_dept: true, name: true } },
        supervisor: { select: { id_emp: true, name: true } },
      },
    })

    await writeAuditLog(tx, actor.id_emp, 'UPDATE', 'Employee', id, { passwordChanged: true })

    return {
      ...updated,
      permissions: ensureRolePermissions(updated.role as Role),
    }
  })
}

export async function deleteAdminUser(id: number, actor: RequestUser) {
  if (actor.id_emp === id) {
    throw new AppError('FORBIDDEN', 403, { reason: 'SELF_DELETE_FORBIDDEN' })
  }

  const target = await ensureCanDemoteOrDeleteAdmin(id)

  return prisma.$transaction(async (tx) => {
    await tx.employee.delete({ where: { id_emp: id } })
    await writeAuditLog(tx, actor.id_emp, 'DELETE', 'Employee', id, target)
  })
}
