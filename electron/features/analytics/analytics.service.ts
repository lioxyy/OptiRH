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

  const candidatesStatus = await prisma.candidat.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  const monthlyEvolution = await prisma.candidat.findMany({
    where: { date_candidature: { gte: twelveMonthsAgo } },
    select: { date_candidature: true, status: true },
  })

  const monthly: Record<string, Record<string, number>> = {}
  for (const c of monthlyEvolution) {
    const key = c.date_candidature.toISOString().slice(0, 7)
    if (!monthly[key]) monthly[key] = { Total: 0, Pending: 0, Accepted: 0, Rejected: 0, 'In Progress': 0 }
    monthly[key][c.status] = (monthly[key][c.status] || 0) + 1
    monthly[key].Total++
  }

  const trend = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({ month, ...counts }))

  return {
    funnel: candidatesStatus.map(s => ({ status: s.status, count: s._count._all })),
    trend
  }
}

export async function getPayrollTrend() {
  const generateMonths = () => {
    const months = []
    const d = new Date()
    for (let i = 11; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
      months.push(m.toISOString().slice(0, 7))
    }
    return months
  }

  const months = generateMonths()
  const payrollData = await prisma.salaire.groupBy({
    by: ['month_year'],
    where: { month_year: { in: months } },
    _sum: { amount_final: true },
  })

  const dataMap = new Map(payrollData.map(d => [d.month_year, d._sum.amount_final ?? 0]))

  return months.map(m => ({
    month: m,
    amount: dataMap.get(m) ?? 0
  }))
}

export async function getScoreDistribution() {
  const evaluations = await prisma.evaluation.findMany({
    where: { type_eval: 'Employee' },
    select: { score: true },
  })

  const buckets = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ]

  evaluations.forEach(e => {
    const s = e.score
    if (s <= 20) buckets[0].count++
    else if (s <= 40) buckets[1].count++
    else if (s <= 60) buckets[2].count++
    else if (s <= 80) buckets[3].count++
    else buckets[4].count++
  })

  return buckets
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

export async function getHeadcountTrend() {
  const generateMonths = () => {
    const months = []
    const d = new Date()
    for (let i = 11; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
      months.push(new Date(m.getFullYear(), m.getMonth() + 1, 0)) // End of month
    }
    return months
  }

  const months = generateMonths()
  const trend = []

  for (const endOfMonth of months) {
    const count = await prisma.employee.count({
      where: { date_employment: { lte: endOfMonth } }
    })
    trend.push({
      month: endOfMonth.toISOString().slice(0, 7),
      count
    })
  }

  return trend
}

export async function getDepartmentStats() {
  const depts = await prisma.department.findMany({
    select: {
      name: true,
      _count: { select: { employees: true } }
    }
  })
  return depts.map(d => ({
    department: d.name,
    count: d._count.employees
  }))
}

export async function getDemographics() {
  const [genders, roles, contracts] = await Promise.all([
    prisma.employee.groupBy({ by: ['gender'], _count: { id_emp: true } }),
    prisma.employee.groupBy({ by: ['role'], _count: { id_emp: true } }),
    prisma.contract.groupBy({
      by: ['type'],
      where: { status: 'Active' },
      _count: { id_contract: true }
    })
  ])

  // Gender by Department (Stacked Bar)
  const genderByDeptRaw = await prisma.employee.findMany({
    select: {
      gender: true,
      departments: { select: { name: true } }
    }
  })

  const deptGenderMap: Record<string, Record<string, number>> = {}
  genderByDeptRaw.forEach(emp => {
    emp.departments.forEach(dept => {
      if (!deptGenderMap[dept.name]) deptGenderMap[dept.name] = { Male: 0, Female: 0, Other: 0 }
      const g = emp.gender || 'Other'
      deptGenderMap[dept.name][g] = (deptGenderMap[dept.name][g] || 0) + 1
    })
  })

  return {
    gender: genders.map(g => ({ label: g.gender || 'Other', value: g._count.id_emp })),
    roles: roles.map(r => ({ label: r.role, value: r._count.id_emp })),
    contracts: contracts.map(c => ({ label: c.type, value: c._count.id_contract })),
    genderByDept: Object.entries(deptGenderMap).map(([dept, counts]) => ({ department: dept, ...counts }))
  }
}

export async function getTenureStats() {
  const employees = await prisma.employee.findMany({
    select: { date_employment: true }
  })

  const today = new Date()
  const tenures = employees.map(e => {
    const diffTime = Math.abs(today.getTime() - e.date_employment.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)) // approx months
  })

  const avgTenure = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0

  return {
    average_months: Math.round(avgTenure)
  }
}

export async function getSupervisionStats() {
  const employees = await prisma.employee.findMany({
    select: {
      supervisor: { select: { name: true } }
    },
    where: { supervisor_id: { not: null } }
  })

  const supervisionMap: Record<string, number> = {}
  employees.forEach(e => {
    const name = e.supervisor?.name || 'Unknown'
    supervisionMap[name] = (supervisionMap[name] || 0) + 1
  })

  return Object.entries(supervisionMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getAbsenceDeepDive() {
  const generateMonths = () => {
    const months = []
    const d = new Date()
    for (let i = 11; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
      months.push(m.toISOString().slice(0, 7))
    }
    return months
  }

  const months = generateMonths()
  const totalEmployees = await prisma.employee.count()
  const expectedWorkDaysPerMonth = 22 // Average

  const absences = await prisma.absence.findMany({
    select: { date_absence: true, is_justified: true, leave_type: { select: { name: true } } }
  })

  const monthlyStats: Record<string, { total: number, justified: number, unjustified: number, byType: Record<string, number> }> = {}
  months.forEach(m => {
    monthlyStats[m] = { total: 0, justified: 0, unjustified: 0, byType: {} }
  })

  absences.forEach(a => {
    const key = a.date_absence.toISOString().slice(0, 7)
    if (monthlyStats[key]) {
      monthlyStats[key].total++
      if (a.is_justified) monthlyStats[key].justified++
      else monthlyStats[key].unjustified++

      const type = a.leave_type?.name || 'Other'
      monthlyStats[key].byType[type] = (monthlyStats[key].byType[type] || 0) + 1
    }
  })

  return Object.entries(monthlyStats).map(([month, data]) => ({
    month,
    rate: totalEmployees > 0 ? (data.total / (totalEmployees * expectedWorkDaysPerMonth)) * 100 : 0,
    justified: data.justified,
    unjustified: data.unjustified,
    byType: data.byType
  }))
}

export async function getLeaveUtilization() {
  const balances = await prisma.congeBalance.groupBy({
    by: ['id_type'],
    _sum: { allocated: true, consumed: true },
  })

  const leaveTypes = await prisma.leaveType.findMany()
  const typeMap = new Map(leaveTypes.map(lt => [lt.id_type, lt.name]))

  return balances.map(b => ({
    type: typeMap.get(b.id_type!) || 'Unknown',
    allocated: b._sum.allocated || 0,
    consumed: b._sum.consumed || 0,
    utilization: (b._sum.allocated ?? 0) > 0 ? ((b._sum.consumed ?? 0) / (b._sum.allocated ?? 0)) * 100 : 0
  }))
}

export async function getPayrollDeepDive() {
  const salaires = await prisma.salaire.findMany({
    select: { month_year: true, amount_final: true, bonus_amount: true, absence_deductions: true }
  })

  // Aggregated totals for the whole period
  let totalBase = 0
  let totalBonus = 0
  let totalDeductions = 0

  salaires.forEach(s => {
    totalBase += (s.amount_final - s.bonus_amount + s.absence_deductions)
    totalBonus += s.bonus_amount
    totalDeductions += s.absence_deductions
  })

  return {
    breakdown: [
      { label: 'Base Salary', value: totalBase },
      { label: 'Bonuses', value: totalBonus },
      { label: 'Deductions', value: totalDeductions }
    ]
  }
}

export async function getDepartmentPayroll() {
  const departments = await prisma.department.findMany({
    select: {
      name: true,
      employees: {
        select: {
          contracts: {
            where: { status: 'Active' },
            select: { salaire_base: true }
          }
        }
      }
    }
  })

  return departments.map(d => {
    const salaries = d.employees.flatMap(e => e.contracts.map(c => c.salaire_base))
    const total = salaries.reduce((a, b) => a + b, 0)
    const avg = salaries.length > 0 ? total / salaries.length : 0
    return {
      department: d.name,
      average: Math.round(avg),
      total: Math.round(total)
    }
  }).sort((a, b) => b.average - a.average)
}

export async function getRolePayrollStats() {
  const employees = await prisma.employee.findMany({
    select: {
      role: true,
      contracts: {
        where: { status: 'Active' },
        select: { salaire_base: true }
      }
    }
  })

  const roleMap: Record<string, { total: number, count: number }> = {}
  employees.forEach(e => {
    const base = e.contracts[0]?.salaire_base || 0
    if (!roleMap[e.role]) roleMap[e.role] = { total: 0, count: 0 }
    roleMap[e.role].total += base
    roleMap[e.role].count += 1
  })

  return Object.entries(roleMap).map(([role, data]) => ({
    role,
    average: Math.round(data.total / data.count)
  })).sort((a, b) => b.average - a.average)
}

export async function getRecruitmentVelocity() {
  const candidates = await prisma.candidat.findMany({
    where: { status: 'Accepted' },
    select: { date_candidature: true, id_cand: true }
  })

  const acceptedIds = candidates.map(c => c.id_cand)

  // Find the date of the LAST favorable entretien for each accepted candidate
  const entretiens = await prisma.entretien.findMany({
    where: { id_cand: { in: acceptedIds } },
    orderBy: { date_heure: 'asc' }
  })

  const velocityData = candidates.map(c => {
    const lastEntretien = entretiens.filter(e => e.id_cand === c.id_cand).pop()
    if (!lastEntretien) return null
    const diffTime = Math.abs(lastEntretien.date_heure.getTime() - c.date_candidature.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }).filter(v => v !== null) as number[]

  const averageDays = velocityData.length > 0
    ? velocityData.reduce((a, b) => a + b, 0) / velocityData.length
    : 0

  return {
    average_days_to_hire: Math.round(averageDays),
    total_hires: velocityData.length
  }
}

export async function getPerformanceTrends() {
  const evaluations = await prisma.evaluation.findMany({
    where: { evaluatee_emp_id: { not: null } },
    select: { date_eval: true, score: true },
    orderBy: { date_eval: 'asc' }
  })

  const trends: Record<string, { total: number, count: number }> = {}
  evaluations.forEach(ev => {
    const month = ev.date_eval.toISOString().slice(0, 7)
    if (!trends[month]) trends[month] = { total: 0, count: 0 }
    trends[month].total += ev.score
    trends[month].count += 1
  })

  return Object.entries(trends).map(([month, data]) => ({
    month,
    average: Math.round(data.total / data.count)
  }))
}

export async function getTaskStats() {
  const total = await prisma.task.count()
  const byStatus = await prisma.task.groupBy({
    by: ['status'],
    _count: { _all: true }
  })

  const overdue = await prisma.task.count({
    where: {
      date_fin: { lt: new Date() },
      status: { not: 'Done' }
    }
  })

  const priorityDist = await prisma.task.groupBy({
    by: ['priority'],
    _count: { _all: true }
  })

  return {
    total,
    overdue,
    status_distribution: byStatus.map(s => ({ status: s.status, count: s._count._all })),
    priority_distribution: priorityDist.map(p => ({ priority: p.priority, count: p._count._all })),
    completion_rate: total > 0
      ? Math.round((byStatus.find(s => s.status === 'Done')?._count._all || 0) / total * 100)
      : 0
  }
}

export async function getFormationStats() {
  const totalSessions = await prisma.formation.count()
  const totalParticipants = await prisma.participationFormation.count()

  const sessions = await prisma.formation.findMany({
    select: {
      date_deb: true,
      id_instructor: true,
      participations: { select: { id_emp: true } }
    }
  })

  const enrollmentByMonth: Record<string, number> = {}
  const instructors: Record<number, number> = {}

  sessions.forEach(s => {
    const month = s.date_deb.toISOString().slice(0, 7)
    enrollmentByMonth[month] = (enrollmentByMonth[month] || 0) + s.participations.length
    if (s.id_instructor) {
      instructors[s.id_instructor] = (instructors[s.id_instructor] || 0) + 1
    }
  })

  return {
    total_sessions: totalSessions,
    total_participants: totalParticipants,
    enrollment_trend: Object.entries(enrollmentByMonth).map(([month, count]) => ({ month, count })),
    top_instructors: Object.entries(instructors).map(([id, count]) => ({ id_instructor: Number(id), count })),
    avg_participants_per_session: totalSessions > 0 ? Number((totalParticipants / totalSessions).toFixed(1)) : 0
  }
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
      id_agent: actorId
    }
  })

  const interviewList = await prisma.entretien.findMany({
    where: {
      status: 'Scheduled',
      date_heure: { gte: new Date() },
      id_agent: actorId
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


/**
 * Unified operational dashboard providing a single source of truth for
 * system-wide or role-scoped operations.
 */
export async function getUnifiedDashboard(actorId: number, role: string = 'Employee', id_depts: number[] = []) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endOfToday = new Date(today)
  endOfToday.setHours(23, 59, 59, 999)

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  // 1. Determine Scope (Case-insensitive)
  const normalizedRole = role?.toLowerCase()
  const isAdmin = normalizedRole === 'admin'
  const isAgent = normalizedRole === 'agent'
  const isEmployee = normalizedRole === 'employee' || !role

  // 2. Fetch KPI Counts with scoping
  const [
    scheduledInterviews,
    expiringContracts,
    pendingPayslips,
    presentPersonnel
  ] = await Promise.all([
    // Interviews: Admins see all, Agents see theirs, Employees see 0
    isEmployee ? Promise.resolve(0) : prisma.entretien.count({
      where: {
        status: 'Scheduled',
        ...(isAgent && { id_agent: actorId })
      }
    }),

    // Expiring Contracts: Admin/Agent only
    isEmployee ? Promise.resolve(0) : prisma.contract.count({
      where: {
        status: 'Active',
        date_fin: { lte: thirtyDaysFromNow, gte: today },
        ...(isAgent && { employee: { departments: { some: { id_dept: { in: id_depts } } } } })
      }
    }),

    // Pending Payslips: Admin only
    isAdmin ? prisma.salaire.count({ where: { status: 'Generated' } }) : Promise.resolve(0),

    // Present Personnel: Admin/Agent see counts, Employees see 0
    isEmployee ? Promise.resolve(0) : prisma.attendance.count({
      where: {
        date: { gte: today, lte: endOfToday },
        status: 'Present',
        ...(isAgent && { employee: { departments: { some: { id_dept: { in: id_depts } } } } })
      }
    })
  ])

  // 3. Fetch Operational Lists with scoping
  const [
    pendingLeaves,
    todaysLogs,
    todaysFormations,
    myTasks
  ] = await Promise.all([
    // Pending Leave Requests: Admin/Agent see theirs
    isEmployee ? Promise.resolve([]) : prisma.conge.findMany({
      where: {
        status: 'Pending',
        ...(isAgent && { employee: { departments: { some: { id_dept: { in: id_depts } } } } })
      },
      include: {
        employee: { select: { name: true, role: true } },
        leave_type: { select: { name: true } }
      },
      orderBy: { date_deb: 'asc' },
      take: 10
    }),

    // Today's System Logs: Admin only (Agents could see theirs, but usually Admin only)
    isAdmin ? prisma.auditLog.findMany({
      where: { timestamp: { gte: today } },
      include: { actor: { select: { name: true } } },
      orderBy: { timestamp: 'desc' },
      take: 10
    }) : Promise.resolve([]),

    // Today's scheduled formations: All see (filtered by role?) 
    // Actually formations are generally public knowledge in a company
    prisma.formation.findMany({
      where: {
        date_deb: { lte: endOfToday, gte: today }
      },
      include: { instructor: { select: { name: true } } },
      take: 5
    }),

    // Current user's pending tasks
    actorId ? prisma.task.findMany({
      where: {
        assigned_to: actorId,
        status: { notIn: ['Done', 'Completed'] }
      },
      orderBy: { date_fin: 'asc' },
      take: 10
    }) : Promise.resolve([])
  ])

  return {
    kpis: {
      scheduledInterviews,
      expiringContracts,
      pendingPayslips,
      presentPersonnel
    },
    tables: {
      pendingLeaves,
      todaysLogs,
      todaysFormations,
      myTasks
    }
  }
}
