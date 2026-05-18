import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import type { CreateEmployeeDTO, UpdateEmployeeDTO } from './employees.types'
import type { RequestUser } from '../../middleware/authenticate'
import bcrypt from 'bcryptjs'

export async function getEmployees(requestUser: RequestUser) {
  if (requestUser.role === 'Admin') {
    return prisma.employee.findMany({
      include: { department: true, supervisor: { select: { id_emp: true, name: true } } },
    })
  }
  if (requestUser.role === 'Agent') {
    return prisma.employee.findMany({
      where: { id_dept: requestUser.id_dept },
      include: { department: true, supervisor: { select: { id_emp: true, name: true } } },
    })
  }
  return prisma.employee.findMany({
    where: { id_emp: requestUser.id_emp },
    include: { department: true },
  })
}

export async function getEmployeeById(id: number, requestUser: RequestUser) {
  const employee = await prisma.employee.findUnique({ where: { id_emp: id } })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)
  if (requestUser.role === 'Agent' && employee.id_dept !== requestUser.id_dept) {
    throw new AppError('FORBIDDEN', 403)
  }
  return employee
}

export async function createEmployee(data: CreateEmployeeDTO, actorId: number) {
  const { password, ...rest } = data
  const password_hash = await bcrypt.hash(password, 10)

  return prisma.$transaction(async (tx) => {
    const existing = await tx.employee.findUnique({ where: { email: rest.email } })
    if (existing) throw new AppError('EMAIL_ALREADY_EXISTS', 409)

    if (rest.role === 'Agent') {
      const existingAgentInDept = await tx.employee.findFirst({
        where: { id_dept: rest.id_dept, role: 'Agent' }
      })
      if (existingAgentInDept) {
        throw new AppError('DEPARTMENT_HAS_AGENT', 400, 'This department already has an agent assigned')
      }
    }

    // Fetch default supervisor based on chosen department manager
    const dept = await tx.department.findUnique({
      where: { id_dept: rest.id_dept },
      select: { manager_id: true }
    })
    const finalSupervisorId = rest.supervisor_id || dept?.manager_id || null

    const employee = await tx.employee.create({
      data: {
        ...rest,
        supervisor_id: finalSupervisorId,
        password_hash
      },
    })

    if (employee.role === 'Agent') {
      await tx.department.updateMany({
        where: { manager_id: employee.id_emp },
        data: { manager_id: null },
      })
      await tx.department.update({
        where: { id_dept: employee.id_dept },
        data: { manager_id: employee.id_emp },
      })
    }

    await writeAuditLog(tx, actorId, 'CREATE', 'Employee', employee.id_emp, employee)
    return employee
  })
}

export async function updateEmployee(id: number, data: UpdateEmployeeDTO, requestUser: RequestUser) {
  const employee = await prisma.employee.findUnique({ where: { id_emp: id } })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  if (requestUser.role === 'Agent' && employee.id_dept !== requestUser.id_dept) {
    throw new AppError('FORBIDDEN', 403)
  }

  const { password, ...rest } = data
  const updateData = password
    ? { ...rest, password_hash: await bcrypt.hash(password, 10) }
    : rest

  return prisma.$transaction(async (tx) => {
    const finalRole = updateData.role !== undefined ? updateData.role : employee.role
    const finalIdDept = updateData.id_dept !== undefined ? updateData.id_dept : employee.id_dept

    if (finalRole === 'Agent') {
      const existingAgentInDept = await tx.employee.findFirst({
        where: {
          id_dept: finalIdDept,
          role: 'Agent',
          id_emp: { not: id }
        }
      })
      if (existingAgentInDept) {
        throw new AppError('DEPARTMENT_HAS_AGENT', 400, 'This department already has an agent assigned')
      }
    }

    // Auto-update supervisor if department was updated and supervisor was not explicitly changed
    let computedSupervisorId: number | null | undefined = updateData.supervisor_id
    if (updateData.id_dept !== undefined && updateData.supervisor_id === undefined) {
      const dept = await tx.department.findUnique({
        where: { id_dept: updateData.id_dept },
        select: { manager_id: true }
      })
      computedSupervisorId = dept?.manager_id ?? null
    }

    const updated = await tx.employee.update({
      where: { id_emp: id },
      data: {
        ...updateData,
        supervisor_id: computedSupervisorId
      },
    })

    if (updated.role === 'Agent') {
      await tx.department.updateMany({
        where: {
          manager_id: updated.id_emp,
          id_dept: { not: updated.id_dept }
        },
        data: { manager_id: null },
      })
      await tx.department.update({
        where: { id_dept: updated.id_dept },
        data: { manager_id: updated.id_emp },
      })
    } else {
      await tx.department.updateMany({
        where: { manager_id: updated.id_emp },
        data: { manager_id: null },
      })
    }

    await writeAuditLog(tx, requestUser.id_emp, 'UPDATE', 'Employee', id, updated)
    return updated
  })
}

export async function deleteEmployee(id: number, actorId: number) {
  const employee = await prisma.employee.findUnique({ where: { id_emp: id } })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  return prisma.$transaction(async (tx) => {
    await tx.department.updateMany({
      where: { manager_id: id },
      data: { manager_id: null },
    })
    await tx.employee.delete({ where: { id_emp: id } })
    await writeAuditLog(tx, actorId, 'DELETE', 'Employee', id, employee)
  })
}

export async function getMe(employeeId: number) {
  const employee = await prisma.employee.findUnique({
    where: { id_emp: employeeId },
    select: {
      id_emp: true, name: true, email: true, phone: true,
      gender: true, date_birth: true, address: true,
      date_employment: true, role: true, id_dept: true,
      supervisor_id: true,
    },
  })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)
  return employee
}


interface OrgNode {
  id_emp: number
  name: string
  role: string
  supervisor_id: number | null
  id_dept: number
  department?: { name: string }
  children: OrgNode[]
}

function buildTree(employees: OrgNode[], parentId: number | null): OrgNode[] {
  return employees
    .filter(e => e.supervisor_id === parentId)
    .map(e => ({ ...e, children: buildTree(employees, e.id_emp) }))
}

export async function getOrgChart() {
  const employees = await prisma.employee.findMany({
    select: {
      id_emp: true,
      name: true,
      role: true,
      supervisor_id: true,
      id_dept: true,
      department: { select: { name: true } },
    },
  })

  return buildTree(employees as OrgNode[], null)
}
