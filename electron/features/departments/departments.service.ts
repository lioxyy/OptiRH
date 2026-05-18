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
      const managerEmp = await tx.employee.findUnique({
        where: { id_emp: finalManagerId },
        select: { role: true }
      })
      if (!managerEmp || (managerEmp.role !== 'Agent' && managerEmp.role !== 'Admin')) {
        throw new AppError('VALIDATION_ERROR', 400, 'Only agents and admins can be department managers')
      }
    }

    const dept = await tx.department.create({
      data: {
        ...deptData,
        manager_id: finalManagerId,
        ...(employee_ids && employee_ids.length > 0 && {
          employees: {
            connect: employee_ids.map(id => ({ id_emp: id }))
          }
        })
      },
    })

    if (finalManagerId) {
      await tx.department.update({
        where: { id_dept: dept.id_dept },
        data: {
          employees: {
            connect: { id_emp: finalManagerId }
          }
        }
      })
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
      } else {
        if (dept.manager_id && !employee_ids.includes(dept.manager_id)) {
          if (finalManagerId === dept.manager_id) {
            finalManagerId = null
          }
        }
      }
    }

    if (finalManagerId) {
      const managerEmp = await tx.employee.findUnique({
        where: { id_emp: finalManagerId },
        select: { role: true }
      })
      if (!managerEmp || (managerEmp.role !== 'Agent' && managerEmp.role !== 'Admin')) {
        throw new AppError('VALIDATION_ERROR', 400, 'Only agents and admins can be department managers')
      }
    }

    const updated = await tx.department.update({
      where: { id_dept: id },
      data: {
        ...deptData,
        manager_id: finalManagerId,
        ...(employee_ids !== undefined && {
          employees: {
            set: [],
            connect: employee_ids.map(eid => ({ id_emp: eid }))
          }
        })
      },
    })

    if (finalManagerId) {
      await tx.department.update({
        where: { id_dept: id },
        data: {
          employees: {
            connect: { id_emp: finalManagerId }
          }
        }
      })
    }

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

    // Business rule: Cannot delete a department if there are employees still assigned to it.
    if (dept._count.employees > 0) {
      throw new AppError('DEPARTMENT_NOT_EMPTY', 400, 'Cannot delete a department that contains employees')
    }

    await tx.department.delete({
      where: { id_dept: id },
    })

    await writeAuditLog(tx, actorId, 'DELETE', 'Department', id, dept)
  })
}
