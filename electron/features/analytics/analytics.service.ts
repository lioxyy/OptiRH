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
  const employees = await prisma.employee.findMany({
    select: {
      gender: true,
      departments: {
        select: {
          id_dept: true,
          name: true
        }
      }
    }
  })

  const resultsMap = new Map<string, { gender: string, department: string, count: number }>()

  for (const emp of employees) {
    const gender = emp.gender ?? 'Unknown'
    if (emp.departments.length === 0) {
      const key = `${gender}-Unknown`
      if (!resultsMap.has(key)) {
        resultsMap.set(key, { gender, department: 'Unknown', count: 0 })
      }
      resultsMap.get(key)!.count++
    } else {
      for (const dept of emp.departments) {
        const key = `${gender}-${dept.name}`
        if (!resultsMap.has(key)) {
          resultsMap.set(key, { gender, department: dept.name, count: 0 })
        }
        resultsMap.get(key)!.count++
      }
    }
  }

  return Array.from(resultsMap.values())
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

export async function getAdminDashboard(actorId: number) {
  const departments = await prisma.department.findMany({
    select: {
      name: true,
      _count: { select: { employees: true } }
    }
  })

  const openPositions = await prisma.candidat.count({
    where: { status: { in: ['Pending', 'In Progress'] } }
  })

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiringContracts = await prisma.contract.count({
    where: {
      status: 'Active',
      date_fin: { lte: thirtyDaysFromNow, gte: new Date() }
    }
  })

  const pendingLeaves = await prisma.conge.count({
    where: { status: 'Pending' }
  })

  const currentMonth = new Date().toISOString().slice(0, 7)
  const payrollAgg = await prisma.salaire.aggregate({
    where: { month_year: currentMonth },
    _sum: { amount_final: true }
  })
  const monthlyPayrollCost = payrollAgg._sum.amount_final ?? 0

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
  
  const [absenceToday, totalEmp] = await Promise.all([
    prisma.absence.count({
      where: { date_absence: { gte: startOfToday, lte: endOfToday } }
    }),
    prisma.employee.count()
  ])
  const absenceRateToday = totalEmp > 0 ? Math.round((absenceToday / totalEmp) * 100) : 0

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
  const newHiresThisMonth = await prisma.employee.count({
    where: { date_employment: { gte: startOfMonth, lte: endOfMonth } }
  })

  const pendingPayslips = await prisma.salaire.count({
    where: { status: 'Generated' }
  })

  const unreadNotifications = await prisma.notification.count({
    where: { recipient_id: actorId, is_read: false }
  })

  return {
    total_headcount: totalEmp,
    departments_headcount: departments,
    open_positions: openPositions,
    expiring_contracts: expiringContracts,
    pending_leaves: pendingLeaves,
    monthly_payroll_cost: monthlyPayrollCost,
    absence_rate_today: absenceRateToday,
    new_hires_this_month: newHiresThisMonth,
    pending_payslips: pendingPayslips,
    unread_notifications: unreadNotifications
  }
}

export async function getAgentDashboard(actorId: number) {
  const agent = await prisma.employee.findUnique({
    where: { id_emp: actorId },
    select: { departments: { select: { id_dept: true } } }
  })
  const deptIds = agent?.departments.map(d => d.id_dept) || []

  if (deptIds.length === 0) {
    return {
      team_size: 0,
      pending_leaves: 0,
      overdue_tasks: 0,
      upcoming_interviews: 0,
      interviews_list: [],
      in_progress_tasks: 0,
      team_absences_today: 0
    }
  }

  const teamSize = await prisma.employee.count({
    where: { departments: { some: { id_dept: { in: deptIds } } } }
  })

  const pendingLeaves = await prisma.conge.count({
    where: {
      status: 'Pending',
      employee: { departments: { some: { id_dept: { in: deptIds } } } }
    }
  })

  const overdueTasks = await prisma.task.count({
    where: {
      date_fin: { lt: new Date() },
      status: { not: 'Done' },
      assignee: { departments: { some: { id_dept: { in: deptIds } } } }
    }
  })

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingInterviews = await prisma.entretien.count({
    where: {
      status: 'Scheduled',
      date_heure: { gte: new Date(), lte: nextWeek },
      interviewer_id: actorId
    }
  })

  const interviewList = await prisma.entretien.findMany({
    where: {
      status: 'Scheduled',
      date_heure: { gte: new Date() },
      interviewer_id: actorId
    },
    orderBy: { date_heure: 'asc' },
    take: 5,
    include: {
      candidat: {
        select: { name: true, email: true }
      }
    }
  })

  const inProgressTasks = await prisma.task.count({
    where: {
      status: 'In Progress',
      assignee: { departments: { some: { id_dept: { in: deptIds } } } }
    }
  })

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
  const teamAbsences = await prisma.absence.count({
    where: {
      date_absence: { gte: startOfToday, lte: endOfToday },
      employee: { departments: { some: { id_dept: { in: deptIds } } } }
    }
  })

  return {
    team_size: teamSize,
    pending_leaves: pendingLeaves,
    overdue_tasks: overdueTasks,
    upcoming_interviews: upcomingInterviews,
    interviews_list: interviewList,
    in_progress_tasks: inProgressTasks,
    team_absences_today: teamAbsences
  }
}

export async function getEmployeeDashboard(actorId: number) {
  const leaveBalances = await prisma.congeBalance.findMany({
    where: { id_emp: actorId },
    include: {
      leave_type: { select: { name: true } }
    }
  })

  const activeTasks = await prisma.task.count({
    where: {
      assigned_to: actorId,
      status: { not: 'Done' }
    }
  })

  const overdueTasks = await prisma.task.count({
    where: {
      assigned_to: actorId,
      date_fin: { lt: new Date() },
      status: { not: 'Done' }
    }
  })

  const lastPayslip = await prisma.salaire.findFirst({
    where: { id_emp: actorId },
    orderBy: { month_year: 'desc' },
    select: { amount_final: true, month_year: true }
  })

  const upcomingFormations = await prisma.participationFormation.count({
    where: {
      id_emp: actorId,
      formation: { date_deb: { gt: new Date() } }
    }
  })

  const pendingLeaves = await prisma.conge.count({
    where: {
      id_emp: actorId,
      status: 'Pending'
    }
  })

  return {
    leave_balances: leaveBalances,
    active_tasks: activeTasks,
    overdue_tasks: overdueTasks,
    last_payslip: lastPayslip ? { amount: lastPayslip.amount_final, period: lastPayslip.month_year } : null,
    upcoming_formations: upcomingFormations,
    pending_leaves: pendingLeaves
  }
}

