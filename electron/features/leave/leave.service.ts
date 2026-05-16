import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { createNotification } from '../../lib/notifications'
import { writeAuditLog } from '../../lib/audit'
import type { RequestUser } from '../../middleware/authenticate'
import type { CreateLeaveDTO } from './leave.types'
import { getDayCount, getDateRange, datesOverlap } from './leave.helpers'

export async function getLeaveTypes() {
  return prisma.leaveType.findMany()
}

export async function getLeaves(user: RequestUser) {
  if (user.role === 'Admin') {
    return prisma.conge.findMany({
      include: { leave_type: true, employee: true, approver: true },
      orderBy: { date_deb: 'desc' },
    })
  }

  if (user.role === 'Agent') {
    return prisma.conge.findMany({
      where: {
        employee: { id_dept: user.id_dept }
      },
      include: { leave_type: true, employee: true, approver: true },
      orderBy: { date_deb: 'desc' },
    })
  }

  return prisma.conge.findMany({
    where: { id_emp: user.id_emp },
    include: { leave_type: true, approver: true },
    orderBy: { date_deb: 'desc' },
  })
}

export async function getLeaveBalance(employeeId: number, year: number) {
  const balances = await prisma.congeBalance.findMany({
    where: { id_emp: employeeId, year },
    include: { leave_type: true },
  })

  return balances.map(b => ({
    ...b,
    remaining: b.allocated + b.carried_over - b.consumed
  }))
}

export async function createLeaveRequest(data: CreateLeaveDTO, employeeId: number) {
  const start = new Date(data.date_deb)
  const end = new Date(data.date_fin)

  const existingLeaves = await prisma.conge.findMany({
    where: {
      id_emp: employeeId,
      status: { not: 'Rejected' }
    }
  })

  for (const leave of existingLeaves) {
    if (datesOverlap(start, end, new Date(leave.date_deb), new Date(leave.date_fin))) {
      throw new AppError('LEAVE_OVERLAP', 409, 'Leave request overlaps with an existing leave')
    }
  }

  return prisma.$transaction(async (tx) => {
    const leave = await tx.conge.create({
      data: {
        id_emp: employeeId,
        id_type: data.id_type,
        date_deb: start,
        date_fin: end,
        status: 'Pending',
      }
    })

    const employee = await tx.employee.findUnique({ where: { id_emp: employeeId } })
    if (employee?.supervisor_id) {
      await createNotification(
        tx,
        employee.supervisor_id,
        'LEAVE_PENDING',
        `New leave request from ${employee.name}`,
        'Conge',
        leave.id_conge
      )
    }

    return leave
  })
}

export async function approveLeave(leaveId: number, approverId: number) {
  return prisma.$transaction(async (tx) => {
    const leave = await tx.conge.findUnique({ where: { id_conge: leaveId } })
    if (!leave) throw new AppError('LEAVE_NOT_FOUND', 404)
    if (leave.status !== 'Pending') throw new AppError('LEAVE_INVALID_STATUS', 400, 'Leave must be Pending to approve')

    const year = new Date(leave.date_deb).getFullYear()
    const balance = await tx.congeBalance.findUnique({
      where: {
        id_emp_id_type_year: {
          id_emp: leave.id_emp,
          id_type: leave.id_type,
          year
        }
      }
    })

    if (!balance) throw new AppError('NOT_FOUND', 404, 'Leave balance not found for this year')

    const days = getDayCount(new Date(leave.date_deb), new Date(leave.date_fin))
    const remaining = balance.allocated + balance.carried_over - balance.consumed

    if (days > remaining) {
      throw new AppError('LEAVE_OVER_ALLOCATION', 400, `Requested ${days} days but only ${remaining} remaining`)
    }

    const updatedLeave = await tx.conge.update({
      where: { id_conge: leaveId },
      data: {
        status: 'Approved',
        approved_by: approverId
      }
    })

    await tx.congeBalance.update({
      where: { id_balance: balance.id_balance },
      data: { consumed: balance.consumed + days }
    })

    const dateRange = getDateRange(new Date(leave.date_deb), new Date(leave.date_fin))
    const absences = dateRange.map(d => ({
      date_absence: d,
      id_type: leave.id_type,
      is_justified: true,
      id_emp: leave.id_emp,
      recorded_by: approverId,
      conge_id: leave.id_conge
    }))

    await tx.absence.createMany({ data: absences })

    await createNotification(
      tx,
      leave.id_emp,
      'LEAVE_APPROVED',
      'Your leave request was approved',
      'Conge',
      leave.id_conge
    )

    await writeAuditLog(tx, approverId, 'APPROVE', 'Conge', leave.id_conge, updatedLeave)

    return updatedLeave
  })
}

export async function rejectLeave(leaveId: number, approverId: number) {
  return prisma.$transaction(async (tx) => {
    const leave = await tx.conge.findUnique({ where: { id_conge: leaveId } })
    if (!leave) throw new AppError('LEAVE_NOT_FOUND', 404)
    if (leave.status !== 'Pending') throw new AppError('LEAVE_INVALID_STATUS', 400, 'Leave must be Pending to reject')

    const updatedLeave = await tx.conge.update({
      where: { id_conge: leaveId },
      data: {
        status: 'Rejected',
        approved_by: approverId
      }
    })

    await createNotification(
      tx,
      leave.id_emp,
      'LEAVE_REJECTED',
      'Your leave request was rejected',
      'Conge',
      leave.id_conge
    )

    await writeAuditLog(tx, approverId, 'REJECT', 'Conge', leave.id_conge, updatedLeave)

    return updatedLeave
  })
}

export async function cancelApprovedLeave(leaveId: number, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const leave = await tx.conge.findUnique({ where: { id_conge: leaveId } })
    if (!leave) throw new AppError('LEAVE_NOT_FOUND', 404)
    if (leave.status !== 'Approved') throw new AppError('LEAVE_INVALID_STATUS', 400, 'Leave must be Approved to cancel')

    const updatedLeave = await tx.conge.update({
      where: { id_conge: leaveId },
      data: { status: 'Rejected' } // Or 'Cancelled', but plan says 'Rejected'
    })

    const year = new Date(leave.date_deb).getFullYear()
    const balance = await tx.congeBalance.findUnique({
      where: {
        id_emp_id_type_year: {
          id_emp: leave.id_emp,
          id_type: leave.id_type,
          year
        }
      }
    })

    if (balance) {
      const days = getDayCount(new Date(leave.date_deb), new Date(leave.date_fin))
      await tx.congeBalance.update({
        where: { id_balance: balance.id_balance },
        data: { consumed: Math.max(0, balance.consumed - days) }
      })
    }

    await tx.absence.deleteMany({
      where: { conge_id: leaveId }
    })

    await writeAuditLog(tx, actorId, 'UPDATE', 'Conge', leave.id_conge, { ...updatedLeave, action: 'Cancelled' })

    return updatedLeave
  })
}
