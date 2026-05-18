import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import type { CreateEmployeeDTO, UpdateEmployeeDTO } from './employees.types'
import type { RequestUser } from '../../middleware/authenticate'
import bcrypt from 'bcryptjs'

export async function getEmployees(requestUser: RequestUser) {
  if (requestUser.role === 'Admin') {
    return prisma.employee.findMany({
      include: { departments: true, supervisor: { select: { id_emp: true, name: true } } },
    })
  }
  if (requestUser.role === 'Agent') {
    const managedDepts = await prisma.department.findMany({
      where: { manager_id: requestUser.id_emp },
      select: { id_dept: true }
    })
    const managedDeptIds = managedDepts.map(d => d.id_dept)

    return prisma.employee.findMany({
      where: {
        departments: {
          some: { id_dept: { in: managedDeptIds } }
        }
      },
      include: { departments: true, supervisor: { select: { id_emp: true, name: true } } },
    })
  }
  return prisma.employee.findMany({
    where: { id_emp: requestUser.id_emp },
    include: { departments: true },
  })
}

export async function getEmployeeById(id: number, requestUser: RequestUser) {
  const employee = await prisma.employee.findUnique({
    where: { id_emp: id },
    include: { departments: true }
  })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  if (requestUser.role === 'Agent') {
    const managedDepts = await prisma.department.findMany({
      where: { manager_id: requestUser.id_emp },
      select: { id_dept: true }
    })
    const managedDeptIds = managedDepts.map(d => d.id_dept)
    const hasOverlap = employee.departments.some(d => managedDeptIds.includes(d.id_dept))
    if (!hasOverlap) {
      throw new AppError('FORBIDDEN', 403)
    }
  }
  return employee
}

export async function createEmployee(data: CreateEmployeeDTO, actorId: number) {
  const { password, id_depts, ...rest } = data as any
  const password_hash = await bcrypt.hash(password, 10)

  return prisma.$transaction(async (tx) => {
    const existing = await tx.employee.findUnique({ where: { email: rest.email } })
    if (existing) throw new AppError('EMAIL_ALREADY_EXISTS', 409)

    if (rest.role === 'Agent') {
      const deptWithAgent = await tx.department.findFirst({
        where: {
          id_dept: { in: id_depts },
          employees: { some: { role: 'Agent' } }
        }
      })
      if (deptWithAgent) {
        throw new AppError('DEPARTMENT_HAS_AGENT', 400, `Department "${deptWithAgent.name}" already has an agent assigned`)
      }
    }

    // Fetch default supervisor based on chosen department manager
    const depts = await tx.department.findMany({
      where: { id_dept: { in: id_depts } },
      select: { manager_id: true }
    })
    const managerIds = depts.map(d => d.manager_id).filter((id): id is number => id !== null)
    const finalSupervisorId = managerIds.length > 0 ? managerIds[0] : null

    const employee = await tx.employee.create({
      data: {
        ...rest,
        supervisor_id: finalSupervisorId,
        password_hash,
        departments: {
          connect: id_depts.map((id: number) => ({ id_dept: id }))
        }
      },
      include: { departments: true }
    })

    if (employee.role === 'Agent') {
      await tx.department.updateMany({
        where: { id_dept: { in: id_depts } },
        data: { manager_id: employee.id_emp },
      })
    }

    await writeAuditLog(tx, actorId, 'CREATE', 'Employee', employee.id_emp, employee)
    return employee
  })
}

export async function updateEmployee(id: number, data: UpdateEmployeeDTO, requestUser: RequestUser) {
  const employee = await prisma.employee.findUnique({
    where: { id_emp: id },
    include: { departments: true }
  })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  if (requestUser.role === 'Agent') {
    const managedDepts = await prisma.department.findMany({
      where: { manager_id: requestUser.id_emp },
      select: { id_dept: true }
    })
    const managedDeptIds = managedDepts.map(d => d.id_dept)
    const hasOverlap = employee.departments.some(d => managedDeptIds.includes(d.id_dept))
    if (!hasOverlap) {
      throw new AppError('FORBIDDEN', 403)
    }
  }

  const { password, id_depts, ...rest } = data as any
  const updateData = password
    ? { ...rest, password_hash: await bcrypt.hash(password, 10) }
    : rest

  return prisma.$transaction(async (tx) => {
    const finalRole = updateData.role !== undefined ? updateData.role : employee.role
    let finalIdDepts: number[]
    if (id_depts !== undefined) {
      finalIdDepts = id_depts
    } else {
      const current = await tx.employee.findUnique({
        where: { id_emp: id },
        select: { departments: { select: { id_dept: true } } }
      })
      finalIdDepts = current?.departments.map(d => d.id_dept) || []
    }

    if (finalRole === 'Agent') {
      const deptWithAgent = await tx.department.findFirst({
        where: {
          id_dept: { in: finalIdDepts },
          employees: { some: { role: 'Agent', id_emp: { not: id } } }
        }
      })
      if (deptWithAgent) {
        throw new AppError('DEPARTMENT_HAS_AGENT', 400, `Department "${deptWithAgent.name}" already has an agent assigned`)
      }
    }

    // Auto-update supervisor if departments were updated
    let computedSupervisorId = employee.supervisor_id
    if (id_depts !== undefined) {
      const depts = await tx.department.findMany({
        where: { id_dept: { in: id_depts } },
        select: { manager_id: true }
      })
      const managerIds = depts.map(d => d.manager_id).filter((id): id is number => id !== null)
      computedSupervisorId = managerIds.length > 0 ? managerIds[0] : null
    }

    const updated = await tx.employee.update({
      where: { id_emp: id },
      data: {
        ...updateData,
        supervisor_id: computedSupervisorId,
        ...(id_depts !== undefined && {
          departments: {
            set: [],
            connect: id_depts.map((did: number) => ({ id_dept: did }))
          }
        })
      },
      include: { departments: true }
    })

    if (updated.role === 'Agent') {
      await tx.department.updateMany({
        where: { id_dept: { in: finalIdDepts } },
        data: { manager_id: updated.id_emp }
      })
    } else {
      await tx.department.updateMany({
        where: { manager_id: updated.id_emp },
        data: { manager_id: null }
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
      date_employment: true, role: true, departments: { select: { id_dept: true } },
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
  departments?: { name: string }[]
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
      departments: { select: { name: true } },
    },
  })

  return buildTree(employees as unknown as OrgNode[], null)
}
