import fs from 'fs'
import path from 'path'
import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import { createNotification } from '../../lib/notifications'

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads/justifications')

// Ensure uploads folder exists
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

// Fetch Absences with optional filters
export async function getAbsences(filters: { id_emp?: number; justification_status?: string } = {}) {
  const whereClause: any = {}
  
  if (filters.id_emp) {
    whereClause.id_emp = Number(filters.id_emp)
  }
  
  if (filters.justification_status) {
    whereClause.justification_status = filters.justification_status
  }

  return prisma.absence.findMany({
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
      leave_type: true
    },
    orderBy: { date_absence: 'desc' }
  })
}

// Manually Log an Absence (Admin/Agent)
export async function logManualAbsence(data: { id_emp: number; date_absence: string; id_type?: number }, actorId: number) {
  const employeeId = Number(data.id_emp)
  const targetDate = new Date(data.date_absence)
  targetDate.setHours(0, 0, 0, 0)

  // 1. Check if employee exists
  const employee = await prisma.employee.findUnique({ where: { id_emp: employeeId } })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404, 'Employee not found')

  // 2. Check if an absence or leave already exists on that day
  const existingAbsence = await prisma.absence.findFirst({
    where: { id_emp: employeeId, date_absence: targetDate }
  })
  if (existingAbsence) {
    throw new AppError('ABSENCE_ALREADY_LOGGED', 400, 'An absence is already logged for this employee on this date')
  }

  return prisma.$transaction(async (tx) => {
    const absence = await tx.absence.create({
      data: {
        id_emp: employeeId,
        date_absence: targetDate,
        id_type: data.id_type ? Number(data.id_type) : null,
        is_justified: false,
        justification_status: 'None',
        recorded_by: actorId
      }
    })

    await writeAuditLog(tx, actorId, 'CREATE', 'Absence', absence.id_absence, absence)
    return absence
  })
}

// Submit Justification File (Employee)
export async function submitJustification(
  absenceId: number,
  base64Payload: string,
  fileName: string,
  employeeId: number
) {
  ensureUploadsDir()

  // 1. Verify absence belongs to employee
  const absence = await prisma.absence.findUnique({
    where: { id_absence: absenceId },
    include: { employee: true }
  })

  if (!absence) throw new AppError('ABSENCE_NOT_FOUND', 404, 'Absence record not found')
  if (absence.id_emp !== employeeId) {
    throw new AppError('UNAUTHORIZED', 403, 'You are not authorized to justify this absence')
  }

  // 2. Extract extension and write base64 payload to file
  const extension = path.extname(fileName) || '.pdf'
  const uniqueFileName = `emp_${employeeId}_abs_${absenceId}_${Date.now()}${extension}`
  const filePath = path.join(UPLOADS_DIR, uniqueFileName)
  const relativePath = `uploads/justifications/${uniqueFileName}`

  // Clean base64 header if present (e.g. "data:application/pdf;base64,")
  const base64Data = base64Payload.replace(/^data:.*?;base64,/, '')
  
  try {
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
  } catch (err) {
    throw new AppError('FILE_WRITE_ERROR', 500, 'Could not save justification document')
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.absence.update({
      where: { id_absence: absenceId },
      data: {
        justification_doc: relativePath,
        justification_status: 'Pending'
      }
    })

    // Notify all agents/admins of a new pending justification
    const hrStaff = await tx.employee.findMany({
      where: { role: { in: ['Admin', 'Agent'] } }
    })

    for (const hr of hrStaff) {
      await createNotification(
        tx,
        hr.id_emp,
        'LEAVE_PENDING', // Using LEAVE_PENDING as type for review requests
        `New absence justification uploaded by ${absence.employee.name}`,
        'Absence',
        absenceId
      )
    }

    return updated
  })
}

// Validate Justification (Admin/Agent)
export async function validateJustification(
  absenceId: number,
  status: 'Approved' | 'Rejected',
  rejectReason: string | null,
  actorId: number
) {
  const absence = await prisma.absence.findUnique({
    where: { id_absence: absenceId }
  })

  if (!absence) throw new AppError('ABSENCE_NOT_FOUND', 404, 'Absence record not found')
  if (absence.justification_status !== 'Pending') {
    throw new AppError('INVALID_STATE', 400, 'This absence is not pending validation')
  }

  const isApproved = status === 'Approved'

  return prisma.$transaction(async (tx) => {
    const updated = await tx.absence.update({
      where: { id_absence: absenceId },
      data: {
        is_justified: isApproved,
        justification_status: status,
        reject_reason: isApproved ? null : rejectReason
      }
    })

    // Log the validation action
    await writeAuditLog(tx, actorId, isApproved ? 'APPROVE' : 'REJECT', 'Absence', absenceId, updated)

    // Notify employee of validation outcome
    await createNotification(
      tx,
      absence.id_emp,
      isApproved ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      isApproved 
        ? 'Your absence justification has been approved.'
        : `Your absence justification was rejected. Reason: ${rejectReason || 'None provided'}`,
      'Absence',
      absenceId
    )

    return updated
  })
}
