import { prisma } from '../../db/client'

export async function getSummary() {
  const totalEmployees = await prisma.employee.count()

  const openPositions = await prisma.candidat.count({
    where: { status: { in: ['Pending', 'In Progress'] } },
  })

  const currentMonth = new Date().toISOString().slice(0, 7)
  const payrollResult = await prisma.salaire.aggregate({
    where: { month_year: currentMonth },
    _sum: { amount_final: true },
  })
  const monthlyPayrollCost = payrollResult._sum.amount_final ?? 0

  const totalEmployeesWithLeave = await prisma.conge.groupBy({
    by: ['id_emp'],
    where: {
      status: 'Approved',
      date_deb: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  })
  const leaveRate = totalEmployees > 0
    ? Math.round((totalEmployeesWithLeave.length / totalEmployees) * 100)
    : 0

  return {
    total_employees: totalEmployees,
    open_positions: openPositions,
    monthly_payroll_cost: monthlyPayrollCost,
    leave_rate: leaveRate,
  }
}

export async function getDiversity() {
  const data = await prisma.employee.groupBy({
    by: ['gender', 'id_dept'],
    _count: true,
  })

  const departments = await prisma.department.findMany({
    select: { id_dept: true, name: true },
  })
  const deptMap = new Map(departments.map(d => [d.id_dept, d.name]))

  return data.map(item => ({
    gender: item.gender ?? 'Unknown',
    department: deptMap.get(item.id_dept) ?? 'Unknown',
    count: item._count,
  }))
}

export async function getAbsenteeRates() {
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const absences = await prisma.absence.findMany({
    where: { date_absence: { gte: twelveMonthsAgo } },
    select: { date_absence: true },
  })

  const monthly: Record<string, number> = {}
  for (const a of absences) {
    const key = a.date_absence.toISOString().slice(0, 7)
    monthly[key] = (monthly[key] || 0) + 1
  }

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))
}

export async function getRecruitmentStats() {
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const candidates = await prisma.candidat.findMany({
    where: { date_candidature: { gte: twelveMonthsAgo } },
    select: { date_candidature: true, status: true },
  })

  const monthly: Record<string, Record<string, number>> = {}
  for (const c of candidates) {
    const key = c.date_candidature.toISOString().slice(0, 7)
    if (!monthly[key]) monthly[key] = { Pending: 0, Accepted: 0, Rejected: 0, 'In Progress': 0 }
    monthly[key][c.status] = (monthly[key][c.status] || 0) + 1
  }

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({ month, ...counts }))
}

export async function getTopPerformers() {
  const data = await prisma.evaluation.groupBy({
    by: ['evaluatee_emp_id'],
    where: {
      evaluatee_emp_id: { not: null },
      type_eval: 'Employee',
    },
    _avg: { score: true },
    orderBy: { _avg: { score: 'desc' } },
    take: 10,
  })

  const employeeIds = data.map(d => d.evaluatee_emp_id!).filter(Boolean)
  const employees = await prisma.employee.findMany({
    where: { id_emp: { in: employeeIds } },
    select: { id_emp: true, name: true },
  })
  const nameMap = new Map(employees.map(e => [e.id_emp, e.name]))

  return data.map(d => ({
    id_emp: d.evaluatee_emp_id,
    name: nameMap.get(d.evaluatee_emp_id!) ?? 'Unknown',
    avg_score: Math.round((d._avg.score ?? 0) * 100) / 100,
  }))
}
