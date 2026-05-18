import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'

/**
 * Retrieves contracts based on filters.
 * Admins/Agents can see all if no id_emp is specified.
 */
export async function getContracts(filters: { id_emp?: number; status?: string } = {}) {
  const whereClause: any = {}

  if (filters.id_emp) {
    whereClause.id_emp = Number(filters.id_emp)
  }

  if (filters.status && filters.status !== 'all') {
    whereClause.status = filters.status
  }

  return prisma.contract.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          role: true,
          departments: { select: { name: true } }
        }
      }
    },
    orderBy: { date_deb: 'desc' }
  })
}

export async function createContract(data: {
  type: string
  date_deb: string
  date_fin?: string | null
  salaire_base: number
  id_emp: number
}, actorId: number) {
  const employeeId = Number(data.id_emp)
  const employee = await prisma.employee.findUnique({ where: { id_emp: employeeId } })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404, 'Employee not found')

  return prisma.$transaction(async (tx) => {
    await tx.contract.updateMany({
      where: { id_emp: employeeId, status: 'Active' },
      data: { status: 'Expired' }
    })

    const contract = await tx.contract.create({
      data: {
        type: data.type,
        date_deb: new Date(data.date_deb),
        date_fin: data.date_fin ? new Date(data.date_fin) : null,
        salaire_base: Number(data.salaire_base),
        id_emp: employeeId,
        status: 'Active'
      }
    })

    await writeAuditLog(tx, actorId, 'CREATE', 'Contract', contract.id_contract, contract)
    return contract
  })
}

export async function terminateContract(contractId: number, actorId: number) {
  const contract = await prisma.contract.findUnique({ where: { id_contract: contractId } })
  if (!contract) throw new AppError('CONTRACT_NOT_FOUND', 404, 'Contract not found')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.contract.update({
      where: { id_contract: contractId },
      data: { status: 'Archived' }
    })
    await writeAuditLog(tx, actorId, 'UPDATE', 'Contract', contractId, updated)
    return updated
  })
}
