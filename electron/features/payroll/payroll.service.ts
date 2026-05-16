import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { createNotification } from '../../lib/notifications'
import { writeAuditLog } from '../../lib/audit'
import type { RequestUser } from '../../middleware/authenticate'
import type { GeneratePayrollDTO } from './payroll.types'
import { prorateSalary } from './payroll.helpers'

export async function getPayslips(user: RequestUser) {
  if (user.role === 'Admin') {
    return prisma.salaire.findMany({
      include: {
        employee: { select: { name: true, id_dept: true } },
        contract: { select: { type: true, salaire_base: true } },
      },
      orderBy: { month_year: 'desc' },
    })
  }

  if (user.role === 'Agent') {
    return prisma.salaire.findMany({
      where: { employee: { id_dept: user.id_dept } },
      include: {
        employee: { select: { name: true, id_dept: true } },
        contract: { select: { type: true, salaire_base: true } },
      },
      orderBy: { month_year: 'desc' },
    })
  }

  return prisma.salaire.findMany({
    where: { id_emp: user.id_emp },
    include: { contract: { select: { type: true, salaire_base: true } } },
    orderBy: { month_year: 'desc' },
  })
}

export async function generatePayroll(data: GeneratePayrollDTO, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.salaire.findUnique({
      where: { id_emp_month_year: { id_emp: data.id_emp, month_year: data.month_year } },
    })
    if (existing) {
      throw new AppError('PAYROLL_ALREADY_GENERATED', 409, 'Payroll already generated for this employee and month')
    }

    const contract = await tx.contract.findFirst({
      where: { id_emp: data.id_emp, status: 'Active' },
    })
    if (!contract) throw new AppError('NO_ACTIVE_CONTRACT', 400, 'Employee has no active contract')

    const proratedBase = prorateSalary(contract.salaire_base, data.month_year, contract.date_deb)
    const amountFinal = proratedBase + data.bonus_amount - data.absence_deductions

    const salaire = await tx.salaire.create({
      data: {
        id_emp: data.id_emp,
        id_contract: contract.id_contract,
        month_year: data.month_year,
        bonus_amount: data.bonus_amount,
        absence_deductions: data.absence_deductions,
        amount_final: Math.max(0, amountFinal),
        status: 'Generated',
      },
    })

    await createNotification(
      tx,
      data.id_emp,
      'PAYROLL_GENERATED',
      `Payslip for ${data.month_year} has been generated`,
      'Salaire',
      salaire.id_salaire,
    )

    await writeAuditLog(tx, actorId, 'GENERATE', 'Salaire', salaire.id_salaire, salaire)

    return salaire
  })
}

export async function updatePayrollStatus(id: number, status: string, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const salaire = await tx.salaire.findUnique({ where: { id_salaire: id } })
    if (!salaire) throw new AppError('NOT_FOUND', 404, 'Payslip not found')

    const validTransitions: Record<string, string[]> = {
      Generated: ['Validated'],
      Validated: ['Paid'],
    }
    const allowed = validTransitions[salaire.status]
    if (!allowed || !allowed.includes(status)) {
      throw new AppError('VALIDATION_ERROR', 400, `Cannot transition from ${salaire.status} to ${status}`)
    }

    const updated = await tx.salaire.update({
      where: { id_salaire: id },
      data: { status },
    })

    await writeAuditLog(tx, actorId, 'UPDATE', 'Salaire', id, updated)
    return updated
  })
}
