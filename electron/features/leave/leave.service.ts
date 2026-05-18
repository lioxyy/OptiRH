import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { createNotification } from '../../lib/notifications'

export async function getLeaveTypes() {
  return prisma.leaveType.findMany({ orderBy: { name: 'asc' } })
}

export async function createLeaveType(data: any) {
  return prisma.leaveType.create({ data })
}

export async function updateLeaveType(id: number, data: any) {
  return prisma.leaveType.update({ where: { id_type: id }, data })
}

export async function getLeaveRequests(filters: { id_emp?: number; status?: string } = {}) {
  return prisma.conge.findMany({
    where: filters,
    include: {
      employee: { select: { name: true, departments: { select: { name: true } } } }, // Tailored for many-to-many
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
  const year = start.getFullYear()

  const balance = await prisma.congeBalance.findUnique({
    where: { id_emp_id_type_year: { id_emp: employeeId, id_type, year } }
  })

  if (!balance) {
    const leaveType = await prisma.leaveType.findUnique({ where: { id_type } })
    if (!leaveType) throw new AppError('LEAVE_TYPE_NOT_FOUND', 404)
    await prisma.congeBalance.create({
      data: { id_emp: employeeId, id_type, year, allocated: leaveType.default_days, consumed: 0, carried_over: 0 }
    })
  }

  const currentBalance = await prisma.congeBalance.findUnique({
    where: { id_emp_id_type_year: { id_emp: employeeId, id_type, year } }
  })

  if (currentBalance && (currentBalance.allocated + currentBalance.carried_over - currentBalance.consumed < daysRequested)) {
    throw new AppError('INSUFFICIENT_BALANCE', 400, 'Not enough leave days remaining')
  }

  return prisma.$transaction(async (tx) => {
    const leaveType = await tx.leaveType.findUnique({ where: { id_type } })
    const employee = await tx.employee.findUnique({ where: { id_emp: employeeId } })

    const conge = await tx.conge.create({
      data: { ...data, date_deb: start, date_fin: end, id_emp: employeeId, status: 'Pending' }
    })

    const startStr = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const endStr   = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const hrStaff = await tx.employee.findMany({ where: { role: { in: ['Admin', 'Agent'] } } })
    for (const hr of hrStaff) {
      await createNotification(
        tx,
        hr.id_emp,
        'LEAVE_PENDING',
        `${employee?.name ?? 'An employee'} submitted a ${leaveType?.name ?? 'leave'} request (${daysRequested} days) — ${startStr} to ${endStr}`,
        'Conge',
        conge.id_conge
      )
    }

    return conge
  })
}

export async function updateLeaveStatus(id: number, status: string, actorId: number) {
  const conge = await prisma.conge.findUnique({
    where: { id_conge: id },
    include: { leave_type: true, employee: true }
  })
  if (!conge) throw new AppError('LEAVE_NOT_FOUND', 404)

  const start = new Date(conge.date_deb)
  const end = new Date(conge.date_fin)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const year = start.getFullYear()
  const startStr = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const endStr   = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const typeName = conge.leave_type?.name ?? 'leave'

  if (status === 'Approved' && conge.status !== 'Approved') {
    return prisma.$transaction(async (tx) => {
      await tx.congeBalance.update({
        where: { id_emp_id_type_year: { id_emp: conge.id_emp, id_type: conge.id_type, year } },
        data: { consumed: { increment: days } }
      })

      const updated = await tx.conge.update({
        where: { id_conge: id },
        data: { status, approved_by: actorId }
      })

      await createNotification(
        tx,
        conge.id_emp,
        'LEAVE_APPROVED',
        `Your ${typeName} request (${days} days) from ${startStr} to ${endStr} has been approved.`,
        'Conge',
        id
      )
      return updated
    })
  } else if (status === 'Rejected') {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.conge.update({ where: { id_conge: id }, data: { status, approved_by: actorId } })
      await createNotification(
        tx,
        conge.id_emp,
        'LEAVE_REJECTED',
        `Your ${typeName} request (${days} days) from ${startStr} to ${endStr} has been rejected.`,
        'Conge',
        id
      )
      return updated
    })
  } else {
    return prisma.conge.update({ where: { id_conge: id }, data: { status, approved_by: actorId } })
  }
}

export async function getEmployeeBalances(employeeId: number, year: number) {
  return prisma.congeBalance.findMany({
    where: { id_emp: employeeId, year },
    include: { leave_type: true }
  })
}
