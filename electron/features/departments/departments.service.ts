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

export async function createDepartment(data: CreateDepartmentDTO, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.department.findFirst({
      where: { name: { equals: data.name } },
    })

    if (existing) {
      throw new AppError('DEPARTMENT_ALREADY_EXISTS', 409, 'A department with this name already exists')
    }

    const dept = await tx.department.create({
      data,
    })

    await writeAuditLog(tx, actorId, 'CREATE', 'Department', dept.id_dept, dept)
    return dept
  })
}

export async function updateDepartment(id: number, data: UpdateDepartmentDTO, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const dept = await tx.department.findUnique({ where: { id_dept: id } })
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

    const updated = await tx.department.update({
      where: { id_dept: id },
      data,
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
