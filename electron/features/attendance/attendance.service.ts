import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'

// Helper to get start of a date (00:00:00)
export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

// Fetch Today's Office Start Time (Global Setting)
export async function getOfficeStartTime(): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'office_start_time' }
  })
  return setting ? setting.value : '09:00'
}

// Get Real-time Today's Attendance Roster for all active employees
export async function getDailyRoster(deptId?: number) {
  const today = getStartOfDay()
  
  const employees = await prisma.employee.findMany({
    where: deptId ? { id_dept: deptId } : {},
    select: {
      id_emp: true,
      name: true,
      email: true,
      role: true,
      department: { select: { name: true } },
      attendance_records: {
        where: { date: today }
      },
      conges: {
        where: {
          status: 'Approved',
          date_deb: { lte: today },
          date_fin: { gte: today }
        }
      }
    }
  })

  return employees.map((emp) => {
    const attendance = emp.attendance_records[0] || null
    const onLeave = emp.conges.length > 0

    let calculatedStatus = 'Absent'
    if (onLeave) {
      calculatedStatus = 'On Leave'
    } else if (attendance) {
      calculatedStatus = attendance.status
    }

    return {
      id_emp: emp.id_emp,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      departmentName: emp.department.name,
      attendance,
      onLeave,
      status: calculatedStatus
    }
  })
}

// Clock In for an Employee
export async function clockIn(employeeId: number, notes?: string) {
  const today = getStartOfDay()
  const now = new Date()

  // 1. Check if already clocked in
  const existing = await prisma.attendance.findUnique({
    where: { id_emp_date: { id_emp: employeeId, date: today } }
  })
  if (existing) {
    throw new AppError('ALREADY_CLOCKED_IN', 400, 'You have already clocked in for today')
  }

  // 2. Fetch office start time setting
  const officeStart = await getOfficeStartTime()
  const [startHour, startMin] = officeStart.split(':').map(Number)

  const currentHour = now.getHours()
  const currentMin = now.getMinutes()

  // 3. Lateness validation
  let status: 'Present' | 'Late' = 'Present'
  if (currentHour > startHour || (currentHour === startHour && currentMin > startMin)) {
    status = 'Late'
  }

  return prisma.attendance.create({
    data: {
      id_emp: employeeId,
      date: today,
      clock_in: now,
      status,
      notes
    }
  })
}

// Clock Out for an Employee
export async function clockOut(employeeId: number, notes?: string) {
  const today = getStartOfDay()
  const now = new Date()

  // 1. Find today's clock-in
  const attendance = await prisma.attendance.findUnique({
    where: { id_emp_date: { id_emp: employeeId, date: today } }
  })
  if (!attendance || !attendance.clock_in) {
    throw new AppError('NOT_CLOCKED_IN', 400, 'No clock-in record found for today')
  }

  if (attendance.clock_out) {
    throw new AppError('ALREADY_CLOCKED_OUT', 400, 'You have already clocked out for today')
  }

  // 2. Calculate working hours
  const clockInTime = new Date(attendance.clock_in).getTime()
  const clockOutTime = now.getTime()
  const workHours = parseFloat(((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2))

  // 3. Mark as Half-Day if work hours are less than 4 hours
  let status = attendance.status
  if (workHours < 4.0) {
    status = 'Half-Day'
  }

  return prisma.attendance.update({
    where: { id_emp_date: { id_emp: employeeId, date: today } },
    data: {
      clock_out: now,
      work_hours: workHours,
      status,
      notes: notes || attendance.notes
    }
  })
}

// Manual Override / Attendance Correction (Admin/Agent)
export async function manualOverride(data: {
  id_emp: number
  date: string
  clock_in?: string | null
  clock_out?: string | null
  status: string
  notes?: string
}, actorId: number) {
  const employeeId = Number(data.id_emp)
  const targetDate = getStartOfDay(new Date(data.date))
  
  const recordData: any = {
    status: data.status,
    notes: data.notes || null,
    clock_in: data.clock_in ? new Date(data.clock_in) : null,
    clock_out: data.clock_out ? new Date(data.clock_out) : null,
  }

  if (recordData.clock_in && recordData.clock_out) {
    const diff = new Date(recordData.clock_out).getTime() - new Date(recordData.clock_in).getTime()
    recordData.work_hours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2))
  } else {
    recordData.work_hours = null
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.attendance.upsert({
      where: { id_emp_date: { id_emp: employeeId, date: targetDate } },
      create: {
        id_emp: employeeId,
        date: targetDate,
        ...recordData
      },
      update: recordData
    })

    await writeAuditLog(tx, actorId, 'UPDATE', 'Attendance', updated.id_attendance, updated)
    return updated
  })
}

// Startup Chrono-Scanner for previous dates
export async function autoGenerateAbsences() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const startLimit = new Date()
  startLimit.setDate(startLimit.getDate() - 7) // Scan up to 7 days back to avoid overloading SQLite

  const activeEmployees = await prisma.employee.findMany({
    where: { role: { in: ['Employee', 'Agent'] } } // Only track operational roles
  })

  let count = 0
  const systemId = 1 // System user or primary Admin

  for (let d = new Date(startLimit); d <= yesterday; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue // Skip weekends (Sunday & Saturday)

    const currentDate = getStartOfDay(d)

    for (const emp of activeEmployees) {
      // Check if employee has attendance
      const attendance = await prisma.attendance.findUnique({
        where: { id_emp_date: { id_emp: emp.id_emp, date: currentDate } }
      })

      if (attendance) continue // Had clock-in

      // Check if employee has an active leave
      const leave = await prisma.conge.findFirst({
        where: {
          id_emp: emp.id_emp,
          status: 'Approved',
          date_deb: { lte: currentDate },
          date_fin: { gte: currentDate }
        }
      })

      if (leave) continue // Had approved leave

      // Check if absence is already logged
      const existingAbsence = await prisma.absence.findFirst({
        where: { id_emp: emp.id_emp, date_absence: currentDate }
      })

      if (existingAbsence) continue // Already logged

      // Automatically generate Absence record
      await prisma.absence.create({
        data: {
          id_emp: emp.id_emp,
          date_absence: currentDate,
          is_justified: false,
          justification_status: 'None',
          recorded_by: systemId
        }
      })
      count++
    }
  }

  console.log(`[Auto-Absences] Checked past week and logged ${count} new absences.`)
  return count
}

// Get personal history for an employee
export async function getPersonalHistory(employeeId: number, filters: { startDate?: Date; endDate?: Date } = {}) {
  const whereClause: any = { id_emp: employeeId }
  
  if (filters.startDate || filters.endDate) {
    whereClause.date = {}
    if (filters.startDate) whereClause.date.gte = filters.startDate
    if (filters.endDate) whereClause.date.lte = filters.endDate
  }

  return prisma.attendance.findMany({
    where: whereClause,
    orderBy: { date: 'desc' }
  })
}
