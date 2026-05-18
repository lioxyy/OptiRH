import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'

export function getMonthRange(monthYear: string): { startDate: Date; endDate: Date } {
  const parts = monthYear.split('-')
  if (parts.length !== 2) throw new AppError('INVALID_MONTH_YEAR', 400, 'Month-Year must be in MM-YYYY format')

  const month = Number(parts[0])
  const year = Number(parts[1])
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) throw new AppError('INVALID_MONTH_YEAR', 400, 'Invalid month/year')

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)
  return { startDate, endDate }
}

export async function generateMonthlyPayroll(employeeId: number, monthYear: string) {
  const contract = await prisma.contract.findFirst({ where: { id_emp: employeeId, status: 'Active' } })
  if (!contract) throw new AppError('NO_ACTIVE_CONTRACT', 400, `No active contract found for employee ID ${employeeId}`)

  const baseSalary = contract.salaire_base
  const { startDate, endDate } = getMonthRange(monthYear)

  const totalUnjustifiedAbsences = await prisma.absence.count({
    where: { id_emp: employeeId, date_absence: { gte: startDate, lte: endDate }, is_justified: false }
  })

  const monthlyMassroufs = await prisma.massrouf.findMany({
    where: { id_emp: employeeId, date_request: { gte: startDate, lte: endDate }, status: 'Approved' }
  })
  const totalMassroufDeductions = monthlyMassroufs.reduce((sum: number, item: any) => sum + item.amount, 0)

  // Fetch bonuses from evaluations for this month
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatee_emp_id: employeeId,
      date_eval: { gte: startDate, lte: endDate }
    }
  })
  const totalBonus = evaluations.reduce((sum, e) => sum + e.bonus_amount, 0)

  const absenceDeductions = totalUnjustifiedAbsences * (baseSalary / 30)
  const amountFinal = Math.max(0, baseSalary + totalBonus - absenceDeductions - totalMassroufDeductions)

  return prisma.salaire.upsert({
    where: { id_emp_month_year: { id_emp: employeeId, month_year: monthYear } },
    create: {
      month_year: monthYear,
      bonus_amount: totalBonus,
      absence_deductions: absenceDeductions,
      amount_final: amountFinal,
      status: 'Generated',
      id_emp: employeeId,
      id_contract: contract.id_contract
    },
    update: {
      bonus_amount: totalBonus,
      absence_deductions: absenceDeductions,
      amount_final: amountFinal
    }
  })
}

export async function getPayrollHistory(filters: { id_emp?: number; month_year?: string } = {}) {
  const whereClause: any = {}
  if (filters.id_emp) whereClause.id_emp = Number(filters.id_emp)
  if (filters.month_year) whereClause.month_year = filters.month_year

  return prisma.salaire.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          role: true,
          departments: { select: { name: true } }
        }
      },
      contract: true
    },
    orderBy: { month_year: 'desc' }
  })
}

export async function validatePayroll(salaireId: number, status: 'Validated' | 'Paid', actorId: number) {
  const payroll = await prisma.salaire.findUnique({ where: { id_salaire: salaireId } })
  if (!payroll) throw new AppError('PAYROLL_NOT_FOUND', 404, 'Payroll record not found')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.salaire.update({ where: { id_salaire: salaireId }, data: { status } })
    await writeAuditLog(tx, actorId, 'UPDATE', 'Salaire', salaireId, updated)
    return updated
  })
}

export async function getPayslips(user: { id_emp: number; role: string }) {
  const filters: any = {}
  if (user.role !== 'Admin' && user.role !== 'Agent') {
    filters.id_emp = user.id_emp
  }
  return getPayrollHistory(filters)
}

export async function generatePayroll(data: {
  id_emp: number
  month_year: string
  bonus_amount?: number
  absence_deductions?: number
}, actorId: number) {
  let monthYear = data.month_year
  if (monthYear.match(/^\d{4}-\d{2}$/)) {
    const [yyyy, mm] = monthYear.split('-')
    monthYear = `${mm}-${yyyy}`
  }

  const contract = await prisma.contract.findFirst({ where: { id_emp: data.id_emp, status: 'Active' } })
  if (!contract) throw new AppError('CONTRACT_NOT_FOUND', 404, `No active contract found for employee ID ${data.id_emp}`)

  const baseSalary = contract.salaire_base
  const { startDate, endDate } = getMonthRange(monthYear)

  const unjustifiedAbsencesCount = await prisma.absence.count({
    where: { id_emp: data.id_emp, date_absence: { gte: startDate, lte: endDate }, is_justified: false }
  })

  const monthlyMassroufs = await prisma.massrouf.findMany({
    where: { id_emp: data.id_emp, date_request: { gte: startDate, lte: endDate }, status: 'Approved' }
  })
  const totalMassroufDeductions = monthlyMassroufs.reduce((sum: number, item: any) => sum + item.amount, 0)

  // Automatic bonus calculation from Evaluations
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatee_emp_id: data.id_emp,
      date_eval: { gte: startDate, lte: endDate }
    }
  })
  const totalBonus = evaluations.reduce((sum, e) => sum + e.bonus_amount, 0)

  const absenceDeductions = unjustifiedAbsencesCount * (baseSalary / 30)

  // Proration for mid-month hires
  let adjustedSalary = baseSalary
  const hireDate = new Date(contract.date_deb)
  if (hireDate > startDate && hireDate <= endDate) {
    const daysInMonth = endDate.getDate()
    const daysWorked = daysInMonth - hireDate.getDate() + 1
    adjustedSalary = (baseSalary / daysInMonth) * daysWorked
  }

  const amountFinal = Math.max(0, adjustedSalary + totalBonus - absenceDeductions - totalMassroufDeductions)

  return prisma.$transaction(async (tx) => {
    const payslip = await tx.salaire.upsert({
      where: { id_emp_month_year: { id_emp: data.id_emp, month_year: monthYear } },
      create: {
        month_year: monthYear,
        bonus_amount: totalBonus,
        absence_deductions: absenceDeductions,
        amount_final: amountFinal,
        status: 'Generated',
        id_emp: data.id_emp,
        id_contract: contract.id_contract
      },
      update: {
        bonus_amount: totalBonus,
        absence_deductions: absenceDeductions,
        amount_final: amountFinal
      }
    })

    await writeAuditLog(tx, actorId, 'CREATE', 'Salaire', payslip.id_salaire, payslip)
    return payslip
  })
}

export async function updatePayrollStatus(salaireId: number, status: 'Validated' | 'Paid', actorId: number) {
  return validatePayroll(salaireId, status, actorId)
}
