import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import type { RequestUser } from '../../middleware/authenticate'
import type { CreateDepartmentDTO, UpdateDepartmentDTO } from './departments.types'

export async function getDepartments(requestUser: RequestUser) {
  if (requestUser.role === 'Employee') {
    throw new AppError('FORBIDDEN', 403)
  }

  return prisma.department.findMany({
    include: {
      manager: {
        select: {
          id_emp: true,
          name: true,
        },
      },
      _count: {
        select: {
          employees: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })
}

export async function getDepartmentById(id: number, requestUser: RequestUser) {
  if (requestUser.role === 'Employee') {
    throw new AppError('FORBIDDEN', 403)
  }

  const dept = await prisma.department.findUnique({
    where: { id_dept: id },
    include: {
      manager: {
        select: {
          id_emp: true,
          name: true,
          email: true,
        },
      },
      employees: {
        select: {
          id_emp: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  if (!dept) {
    throw new AppError('DEPARTMENT_NOT_FOUND', 404)
  }

  return dept
}

export async function createDepartment(data: CreateDepartmentDTO & { employee_ids?: number[] }, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.department.findFirst({
      where: { name: { equals: data.name } },
    })

    if (existing) {
      throw new AppError('DEPARTMENT_ALREADY_EXISTS', 409, 'A department with this name already exists')
    }

    const { employee_ids, ...deptData } = data

    let finalManagerId = deptData.manager_id
    if (employee_ids && employee_ids.length > 0) {
      const assignedAgents = await tx.employee.findMany({
        where: {
          id_emp: { in: employee_ids },
          role: 'Agent'
        },
        select: { id_emp: true }
      })
      if (assignedAgents.length > 1) {
        throw new AppError('DEPARTMENT_HAS_AGENT', 400, 'A department can have at most one agent assigned')
      }
      if (assignedAgents.length > 0) {
        finalManagerId = assignedAgents[0].id_emp
      }
    }

    if (finalManagerId) {
      await tx.department.updateMany({
        where: { manager_id: finalManagerId },
        data: { manager_id: null },
      })
    }

    const dept = await tx.department.create({
      data: {
        ...deptData,
        manager_id: finalManagerId,
      },
    })

    if (employee_ids && employee_ids.length > 0) {
      await tx.employee.updateMany({
        where: { id_emp: { in: employee_ids } },
        data: { id_dept: dept.id_dept },
      })

      if (finalManagerId) {
        await tx.employee.update({
          where: { id_emp: finalManagerId },
          data: { id_dept: dept.id_dept },
        })
      }
    }

    await writeAuditLog(tx, actorId, 'CREATE', 'Department', dept.id_dept, dept)
    return dept
  })
}

export async function updateDepartment(id: number, data: UpdateDepartmentDTO & { employee_ids?: number[] }, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const dept = await tx.department.findUnique({
      where: { id_dept: id },
      include: { employees: { select: { id_emp: true } } },
    })
    if (!dept) {
      throw new AppError('DEPARTMENT_NOT_FOUND', 404)
    }

    if (data.name && data.name !== dept.name) {
      const existing = await tx.department.findFirst({
        where: { name: { equals: data.name } },
      })
      if (existing) {
        throw new AppError('DEPARTMENT_ALREADY_EXISTS', 409, 'A department with this name already exists')
      }
    }

    const { employee_ids, ...deptData } = data

    let finalManagerId = deptData.manager_id !== undefined ? deptData.manager_id : dept.manager_id

    if (employee_ids !== undefined) {
      const currentEmpIds = dept.employees.map((e) => e.id_emp)
      const toConnect = employee_ids
      const toDisconnect = currentEmpIds.filter((empId) => !toConnect.includes(empId))

      const assignedAgents = await tx.employee.findMany({
        where: {
          id_emp: { in: toConnect },
          role: 'Agent'
        },
        select: { id_emp: true }
      })

      if (assignedAgents.length > 1) {
        throw new AppError('DEPARTMENT_HAS_AGENT', 400, 'A department can have at most one agent assigned')
      }

      if (assignedAgents.length > 0) {
        finalManagerId = assignedAgents[0].id_emp
      } else {
        if (dept.manager_id && toDisconnect.includes(dept.manager_id)) {
          if (finalManagerId === dept.manager_id) {
            finalManagerId = null
          }
        }
      }

      if (toDisconnect.length > 0) {
        const disconnectManagerIds = toDisconnect.filter((empId) => empId === dept.manager_id)
        if (disconnectManagerIds.length > 0) {
          if (finalManagerId === dept.manager_id) {
            finalManagerId = null
          }
        }

        await tx.employee.updateMany({
          where: { id_emp: { in: toDisconnect } },
          data: { id_dept: 1 },
        })
      }

      if (toConnect.length > 0) {
        await tx.employee.updateMany({
          where: { id_emp: { in: toConnect } },
          data: { id_dept: id },
        })
      }
    }

    if (finalManagerId) {
      await tx.department.updateMany({
        where: {
          manager_id: finalManagerId,
          id_dept: { not: id }
        },
        data: { manager_id: null },
      })

      await tx.employee.update({
        where: { id_emp: finalManagerId },
        data: { id_dept: id },
      })
    }

    const updated = await tx.department.update({
      where: { id_dept: id },
      data: {
        ...deptData,
        manager_id: finalManagerId,
      },
    })

    await writeAuditLog(tx, actorId, 'UPDATE', 'Department', id, updated)
    return updated
  })
}

export async function deleteDepartment(id: number, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const dept = await tx.department.findUnique({
      where: { id_dept: id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    })

    if (!dept) {
      throw new AppError('DEPARTMENT_NOT_FOUND', 404)
    }

    // Business rule: Cannot delete a department if there are employees still assigned to it to prevent orphaned employee records.
    if (dept._count.employees > 0) {
      throw new AppError('DEPARTMENT_NOT_EMPTY', 400, 'Cannot delete a department that contains employees')
    }

    await tx.department.delete({
      where: { id_dept: id },
    })

    await writeAuditLog(tx, actorId, 'DELETE', 'Department', id, dept)
  })
}
