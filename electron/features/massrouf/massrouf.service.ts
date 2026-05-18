import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import { createNotification } from '../../lib/notifications'

export async function requestMassrouf(employeeId: number, amount: number) {
  const currentYear = new Date().getFullYear()
  const startDate = new Date(currentYear, 0, 1)
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59)

  const requestCount = await prisma.massrouf.count({
    where: {
      id_emp: employeeId,
      date_request: { gte: startDate, lte: endDate },
      status: { in: ['Pending', 'Approved'] }
    }
  })

  if (requestCount >= 2) throw new AppError('FORBIDDEN', 403, 'Yearly limit reached (max 2 requests per calendar year)')

  const contract = await prisma.contract.findFirst({ where: { id_emp: employeeId, status: 'Active' } })
  if (!contract) throw new AppError('NO_ACTIVE_CONTRACT', 400, 'Cannot request an advance: no active contract found.')

  const maxAllowed = contract.salaire_base * 0.5
  if (amount > maxAllowed) throw new AppError('FORBIDDEN', 400, `Amount exceeds allowed limit of 50% (${maxAllowed.toLocaleString()} DZD)`)
  if (amount <= 0) throw new AppError('FORBIDDEN', 400, 'Amount must be a positive value.')

  return prisma.$transaction(async (tx) => {
    const request = await tx.massrouf.create({
      data: { id_emp: employeeId, amount, status: 'Pending' },
      include: { employee: true }
    })

    const hrStaff = await tx.employee.findMany({ where: { role: { in: ['Admin', 'Agent'] } } })
    for (const hr of hrStaff) {
      await createNotification(
        tx,
        hr.id_emp,
        'LEAVE_PENDING',
        `New Massrouf request of ${amount.toLocaleString()} DZD submitted by ${request.employee.name}`,
        'Massrouf',
        request.id_massrouf
      )
    }
    return request
  })
}

export async function getEmployeeMassroufs(employeeId: number) {
  return prisma.massrouf.findMany({ where: { id_emp: employeeId }, orderBy: { date_request: 'desc' } })
}

export async function getPendingMassroufs() {
  return prisma.massrouf.findMany({
    where: { status: 'Pending' },
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          role: true,
          departments: { select: { name: true } } // Selects departments list array
        }
      }
    },
    orderBy: { date_request: 'desc' }
  })
}

export async function validateMassrouf(massroufId: number, status: 'Approved' | 'Rejected', actorId: number) {
  const request = await prisma.massrouf.findUnique({ where: { id_massrouf: massroufId } })
  if (!request) throw new AppError('MASSROUF_NOT_FOUND', 404, 'Massrouf request not found')
  if (request.status !== 'Pending') throw new AppError('INVALID_STATE', 400, 'This request has already been processed')

  const isApproved = status === 'Approved'

  return prisma.$transaction(async (tx) => {
    const updated = await tx.massrouf.update({
      where: { id_massrouf: massroufId },
      data: { status, approved_by: isApproved ? actorId : null }
    })

    await writeAuditLog(tx, actorId, isApproved ? 'APPROVE' : 'REJECT', 'Massrouf', massroufId, updated)
    await createNotification(
      tx,
      request.id_emp,
      isApproved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      isApproved 
        ? `Your salary advance request of ${request.amount.toLocaleString()} DZD was approved.`
        : `Your salary advance request of ${request.amount.toLocaleString()} DZD was rejected.`,
      'Massrouf',
      massroufId
    )
    return updated
  })
}

export async function getMassroufHistory(filters: { id_emp?: number; status?: string } = {}) {
  const whereClause: any = {}
  if (filters.id_emp) whereClause.id_emp = Number(filters.id_emp)
  if (filters.status) whereClause.status = filters.status
  
  return prisma.massrouf.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          role: true,
          departments: { select: { name: true } } // Tailored for many-to-many departments
        }
      }
    },
    orderBy: { date_request: 'desc' }
  })
}
