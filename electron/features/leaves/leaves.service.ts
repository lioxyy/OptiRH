import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'

export async function getLeaveTypes() {
  return prisma.leaveType.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function createLeaveType(data: any) {
  return prisma.leaveType.create({ data })
}

export async function updateLeaveType(id: number, data: any) {
  return prisma.leaveType.update({
    where: { id_type: id },
    data,
  })
}

export async function getLeaveRequests(filters: { id_emp?: number; status?: string } = {}) {
  return prisma.conge.findMany({
    where: filters,
    include: {
      employee: { select: { name: true, id_dept: true } },
      leave_type: true,
    },
    orderBy: { date_deb: 'desc' },
  })
}

export async function createLeaveRequest(employeeId: number, data: any) {
  const { id_type, date_deb, date_fin } = data
  const start = new Date(date_deb)
  const end = new Date(date_fin)
  
  if (start >= end) throw new AppError('INVALID_DATES', 400, 'Start date must be before end date')

  const daysRequested = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Check balance
  const year = start.getFullYear()
  const balance = await prisma.congeBalance.findUnique({
    where: { id_emp_id_type_year: { id_emp: employeeId, id_type, year } }
  })

  if (!balance) {
    // If no balance exists, we should probably initialize it with default_days
    const leaveType = await prisma.leaveType.findUnique({ where: { id_type } })
    if (!leaveType) throw new AppError('LEAVE_TYPE_NOT_FOUND', 404)
    
    await prisma.congeBalance.create({
      data: {
        id_emp: employeeId,
        id_type,
        year,
        allocated: leaveType.default_days,
        consumed: 0,
        carried_over: 0
      }
    })
  }

  const currentBalance = await prisma.congeBalance.findUnique({
    where: { id_emp_id_type_year: { id_emp: employeeId, id_type, year } }
  })

  if (currentBalance && (currentBalance.allocated + currentBalance.carried_over - currentBalance.consumed < daysRequested)) {
    throw new AppError('INSUFFICIENT_BALANCE', 400, 'Not enough leave days remaining')
  }

  return prisma.conge.create({
    data: {
      ...data,
      date_deb: start,
      date_fin: end,
      id_emp: employeeId,
      status: 'Pending'
    }
  })
}

export async function updateLeaveStatus(id: number, status: string, actorId: number) {
  const conge = await prisma.conge.findUnique({
    where: { id_conge: id },
    include: { leave_type: true }
  })
  if (!conge) throw new AppError('LEAVE_NOT_FOUND', 404)

  if (status === 'Approved' && conge.status !== 'Approved') {
    const start = new Date(conge.date_deb)
    const end = new Date(conge.date_fin)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const year = start.getFullYear()

    return prisma.$transaction(async (tx) => {
      await tx.congeBalance.update({
        where: { id_emp_id_type_year: { id_emp: conge.id_emp, id_type: conge.id_type, year } },
        data: { consumed: { increment: days } }
      })
      return tx.conge.update({
        where: { id_conge: id },
        data: { status, approved_by: actorId }
      })
    })
  } else {
    return prisma.conge.update({
      where: { id_conge: id },
      data: { status, approved_by: (status === 'Rejected' || status === 'Approved') ? actorId : undefined }
    })
  }
}

export async function getEmployeeBalances(employeeId: number, year: number) {
  return prisma.congeBalance.findMany({
    where: { id_emp: employeeId, year },
    include: { leave_type: true }
  })
}
