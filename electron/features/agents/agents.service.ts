import bcrypt from 'bcryptjs'
import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import type { RequestUser } from '../../middleware/authenticate'

type CreateAgentInput = {
  name: string
  email: string
  phone?: string
  gender?: string
  date_birth: string
  address?: string
  date_employment: string
  id_dept: number
  supervisor_id?: number
  password: string
}

type UpdateAgentInput = Partial<Omit<CreateAgentInput, 'password'>>

const agentInclude = {
  department: { select: { id_dept: true, name: true } },
  supervisor: { select: { id_emp: true, name: true } },
  subordinates: {
    select: { id_emp: true, name: true, email: true, role: true, department: { select: { name: true } } },
  },
} as const

export async function listAgents() {
  return prisma.employee.findMany({
    where: { role: 'Agent' },
    include: agentInclude,
    orderBy: { id_emp: 'asc' },
  })
}

export async function getAgentById(id: number) {
  const agent = await prisma.employee.findFirst({
    where: { id_emp: id, role: 'Agent' },
    include: agentInclude,
  })
  if (!agent) throw new AppError('EMPLOYEE_NOT_FOUND', 404)
  return agent
}

export async function createAgent(data: CreateAgentInput, actorId: number) {
  const existing = await prisma.employee.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError('EMAIL_ALREADY_EXISTS', 409)

  const password_hash = await bcrypt.hash(data.password, 10)

  return prisma.$transaction(async (tx) => {
    const agent = await tx.employee.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        address: data.address,
        date_birth: new Date(data.date_birth),
        date_employment: new Date(data.date_employment),
        role: 'Agent',
        id_dept: data.id_dept,
        supervisor_id: data.supervisor_id,
        password_hash,
      },
      include: agentInclude,
    })
    await writeAuditLog(tx, actorId, 'CREATE', 'Employee', agent.id_emp, agent)
    return agent
  })
}

export async function updateAgent(id: number, patch: UpdateAgentInput, actor: RequestUser) {
  const existing = await prisma.employee.findFirst({ where: { id_emp: id, role: 'Agent' } })
  if (!existing) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  if (patch.email && patch.email !== existing.email) {
    const conflict = await prisma.employee.findUnique({ where: { email: patch.email } })
    if (conflict) throw new AppError('EMAIL_ALREADY_EXISTS', 409)
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id_emp: id },
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.phone !== undefined && { phone: patch.phone }),
        ...(patch.gender !== undefined && { gender: patch.gender }),
        ...(patch.address !== undefined && { address: patch.address }),
        ...(patch.id_dept !== undefined && { id_dept: patch.id_dept }),
        ...(patch.supervisor_id !== undefined && { supervisor_id: patch.supervisor_id }),
        ...(patch.date_birth !== undefined && { date_birth: new Date(patch.date_birth) }),
        ...(patch.date_employment !== undefined && { date_employment: new Date(patch.date_employment) }),
      },
      include: agentInclude,
    })
    await writeAuditLog(tx, actor.id_emp, 'UPDATE', 'Employee', id, updated)
    return updated
  })
}

export async function deleteAgent(id: number, actor: RequestUser) {
  const existing = await prisma.employee.findFirst({ where: { id_emp: id, role: 'Agent' } })
  if (!existing) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  return prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { supervisor_id: id },
      data: { supervisor_id: null },
    } as Parameters<typeof tx.employee.update>[0])
    await tx.employee.delete({ where: { id_emp: id } })
    await writeAuditLog(tx, actor.id_emp, 'DELETE', 'Employee', id, existing)
  })
}

export async function changeAgentDepartment(id: number, id_dept: number, actorId: number) {
  const existing = await prisma.employee.findFirst({ where: { id_emp: id, role: 'Agent' } })
  if (!existing) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  const dept = await prisma.department.findUnique({ where: { id_dept } })
  if (!dept) throw new AppError('DEPARTMENT_NOT_FOUND', 404)

  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id_emp: id },
      data: { id_dept },
      include: agentInclude,
    })
    await writeAuditLog(tx, actorId, 'UPDATE', 'Employee', id, { id_dept })
    return updated
  })
}

export async function getAgentTeam(id: number) {
  const existing = await prisma.employee.findFirst({ where: { id_emp: id, role: 'Agent' } })
  if (!existing) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  return prisma.employee.findMany({
    where: { supervisor_id: id },
    select: {
      id_emp: true,
      name: true,
      email: true,
      role: true,
      department: { select: { id_dept: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function assignTeamMember(agentId: number, empId: number, actorId: number) {
  const agent = await prisma.employee.findFirst({ where: { id_emp: agentId, role: 'Agent' } })
  if (!agent) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  const emp = await prisma.employee.findUnique({ where: { id_emp: empId } })
  if (!emp) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  if (empId === agentId) throw new AppError('CONFLICT', 409)

  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id_emp: empId },
      data: { supervisor_id: agentId },
      select: { id_emp: true, name: true, role: true },
    })
    await writeAuditLog(tx, actorId, 'UPDATE', 'Employee', empId, { supervisor_id: agentId })
    return updated
  })
}

export async function removeTeamMember(agentId: number, empId: number, actorId: number) {
  const agent = await prisma.employee.findFirst({ where: { id_emp: agentId, role: 'Agent' } })
  if (!agent) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  const emp = await prisma.employee.findFirst({ where: { id_emp: empId, supervisor_id: agentId } })
  if (!emp) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  return prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id_emp: empId },
      data: { supervisor_id: null },
    })
    await writeAuditLog(tx, actorId, 'UPDATE', 'Employee', empId, { supervisor_id: null })
  })
}
