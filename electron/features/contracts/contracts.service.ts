import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'

export async function getContracts(user: any) {
  const whereClause: any = {}

  if (user.role === 'Employee') {
    whereClause.id_emp = Number(user.id_emp)
  } else if (user.role === 'Agent') {
    const managedDepts = await prisma.department.findMany({
      where: { manager_id: user.id_emp },
      select: { id_dept: true }
    })
    const managedDeptIds = managedDepts.map(d => d.id_dept)

    whereClause.OR = [
      { id_emp: user.id_emp },
      { employee: { supervisor_id: user.id_emp } },
      { employee: { departments: { some: { id_dept: { in: managedDeptIds } } } } }
    ]
  }

  return prisma.contract.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          role: true,
          departments: { select: { name: true } } // Changed from department to departments
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
