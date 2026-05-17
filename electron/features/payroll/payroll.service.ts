import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'

// Parse monthYear string "MM-YYYY" to start and end dates of the month
export function getMonthRange(monthYear: string): { startDate: Date; endDate: Date } {
  const parts = monthYear.split('-')
  if (parts.length !== 2) throw new AppError('INVALID_MONTH_YEAR', 400, 'Month-Year must be in MM-YYYY format')
  
  const month = Number(parts[0])
  const year = Number(parts[1])

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    throw new AppError('INVALID_MONTH_YEAR', 400, 'Invalid month or year values')
  }

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59) // Last day of month
  return { startDate, endDate }
}

// Generate or update payroll slip for an employee
export async function generateMonthlyPayroll(employeeId: number, monthYear: string) {
  // 1. Fetch active contract for base salary
  const contract = await prisma.contract.findFirst({
    where: { id_emp: employeeId, status: 'Active' }
  })
  if (!contract) {
    throw new AppError('NO_ACTIVE_CONTRACT', 400, `No active contract found for employee ID ${employeeId}`)
  }

  const baseSalary = contract.salaire_base
  const { startDate, endDate } = getMonthRange(monthYear)

  // 2. Count unjustified absences during the target month
  const totalUnjustifiedAbsences = await prisma.absence.count({
    where: {
      id_emp: employeeId,
      date_absence: { gte: startDate, lte: endDate },
      is_justified: false
    }
  })

  // 3. Fetch approved salary advances (Massrouf) to be deducted this month
  const monthlyMassroufs = await prisma.massrouf.findMany({
    where: {
      id_emp: employeeId,
      date_request: { gte: startDate, lte: endDate },
      status: 'Approved'
    }
  })
  const totalMassroufDeductions = monthlyMassroufs.reduce((sum, item) => sum + item.amount, 0)

  // 4. Apply the academic formula
  const absenceDeductions = totalUnjustifiedAbsences * (baseSalary / 30)
  
  // Salary cannot be negative
  const amountFinal = Math.max(0, baseSalary - absenceDeductions - totalMassroufDeductions)

  // 5. Create or update Salaire record
  return prisma.salaire.upsert({
    where: { id_emp_month_year: { id_emp: employeeId, month_year: monthYear } },
    create: {
      month_year: monthYear,
      bonus_amount: 0,
      absence_deductions: absenceDeductions,
      amount_final: amountFinal,
      status: 'Generated',
      id_emp: employeeId,
      id_contract: contract.id_contract
    },
    update: {
      absence_deductions: absenceDeductions,
      amount_final: amountFinal
    }
  })
}

// Fetch all generated payroll slips
export async function getPayrollHistory(filters: { id_emp?: number; month_year?: string } = {}) {
  const whereClause: any = {}
  
  if (filters.id_emp) {
    whereClause.id_emp = Number(filters.id_emp)
  }
  
  if (filters.month_year) {
    whereClause.month_year = filters.month_year
  }

  return prisma.salaire.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          name: true,
          email: true,
          role: true,
          department: { select: { name: true } }
        }
      },
      contract: true
    },
    orderBy: { month_year: 'desc' }
  })
}

// Approve or pay payroll slip (Admin/Agent)
export async function validatePayroll(salaireId: number, status: 'Validated' | 'Paid', actorId: number) {
  const payroll = await prisma.salaire.findUnique({
    where: { id_salaire: salaireId }
  })
  if (!payroll) throw new AppError('PAYROLL_NOT_FOUND', 404, 'Payroll record not found')

  return prisma.$transaction(async (tx) => {
    const updated = await tx.salaire.update({
      where: { id_salaire: salaireId },
      data: { status }
    })

    await writeAuditLog(tx, actorId, 'UPDATE', 'Salaire', salaireId, updated)
    return updated
  })
}
