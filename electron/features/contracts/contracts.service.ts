import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import type { RequestUser } from '../../middleware/authenticate'
import type { CreateContractDTO } from './contracts.types'

export async function getContracts(user: RequestUser) {
  if (user.role === 'Admin') {
    return prisma.contract.findMany({
      include: { employee: { select: { name: true, id_dept: true } } },
      orderBy: { date_deb: 'desc' },
    })
  }

  if (user.role === 'Agent') {
    return prisma.contract.findMany({
      where: {
        employee: { id_dept: user.id_dept }
      },
      include: { employee: { select: { name: true, id_dept: true } } },
      orderBy: { date_deb: 'desc' },
    })
  }

  return prisma.contract.findMany({
    where: { id_emp: user.id_emp },
    orderBy: { date_deb: 'desc' },
  })
}

export async function createContract(data: CreateContractDTO, actorId: number) {
  const existingActive = await prisma.contract.findFirst({
    where: {
      id_emp: data.id_emp,
      status: 'Active',
    },
  })

  if (existingActive) {
    throw new AppError('CONFLICT', 409, 'Employee already has an active contract')
  }

  return prisma.$transaction(async (tx) => {
    const contract = await tx.contract.create({
      data: {
        id_emp: data.id_emp,
        type: data.type,
        date_deb: new Date(data.date_deb),
        date_fin: data.date_fin ? new Date(data.date_fin) : null,
        salaire_base: data.salaire_base,
        status: 'Active',
      },
    })

    await writeAuditLog(tx, actorId, 'CREATE', 'Contract', contract.id_contract, contract)
    return contract
  })
}

export async function terminateContract(id: number, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const contract = await tx.contract.findUnique({ where: { id_contract: id } })
    if (!contract) throw new AppError('CONTRACT_NOT_FOUND', 404)

    const updatedContract = await tx.contract.update({
      where: { id_contract: id },
      data: {
        status: 'Terminated',
        date_fin: contract.date_fin || new Date(),
      },
    })

    await writeAuditLog(tx, actorId, 'UPDATE', 'Contract', id, { ...updatedContract, action: 'Terminate' })
    return updatedContract
  })
}

export async function getActiveContract(employeeId: number) {
  return prisma.contract.findFirst({
    where: {
      id_emp: employeeId,
      status: 'Active',
    },
  })
}
