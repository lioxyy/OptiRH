import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { signToken, signRefreshToken, verifyToken } from '../../lib/auth'
import { createNotification } from '../../lib/notifications'
import bcrypt from 'bcryptjs'

export async function login(email: string, password: string) {
  const employee = await prisma.employee.findUnique({ where: { email } })
  if (!employee) throw new AppError('UNAUTHORIZED', 401)

  const valid = await bcrypt.compare(password, employee.password_hash)
  if (!valid) throw new AppError('UNAUTHORIZED', 401)

  const payload = { id_emp: employee.id_emp, role: employee.role as 'Admin' | 'Agent' | 'Employee', id_dept: employee.id_dept }

  await checkExpiringContracts(employee.id_emp, employee.role)

  return {
    access_token: signToken(payload),
    refresh_token: signRefreshToken(payload),
    user: {
      id_emp: employee.id_emp,
      name: employee.name,
      email: employee.email,
      role: employee.role as 'Admin' | 'Agent' | 'Employee',
      id_dept: employee.id_dept,
    },
  }
}

export async function refresh(refreshToken: string) {
  const payload = verifyToken(refreshToken)
  if (!payload) throw new AppError('INVALID_TOKEN', 401)

  const employee = await prisma.employee.findUnique({ where: { id_emp: payload.id_emp } })
  if (!employee) throw new AppError('UNAUTHORIZED', 401)

  return {
    access_token: signToken({ id_emp: employee.id_emp, role: employee.role as 'Admin' | 'Agent' | 'Employee', id_dept: employee.id_dept }),
  }
}

export async function getMe(employeeId: number) {
  const employee = await prisma.employee.findUnique({
    where: { id_emp: employeeId },
    select: {
      id_emp: true, name: true, email: true, phone: true,
      gender: true, date_birth: true, address: true,
      date_employment: true, role: true, id_dept: true,
      supervisor_id: true,
    },
  })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)
  return employee
}

async function checkExpiringContracts(employeeId: number, role: string) {
  if (role !== 'Admin' && role !== 'Agent') return

  const thirtyDays = new Date()
  thirtyDays.setDate(thirtyDays.getDate() + 30)

  const contracts = await prisma.contract.findMany({
    where: {
      status: 'Active',
      date_fin: { lte: thirtyDays },
    },
    include: {
      employee: { select: { name: true, supervisor_id: true } },
    },
  })

  const admins = await prisma.employee.findMany({
    where: { role: 'Admin' },
    select: { id_emp: true },
  })
  const adminIds = admins.map(a => a.id_emp)

  for (const contract of contracts) {
    const supervisors: number[] = []
    if (contract.employee.supervisor_id) {
      supervisors.push(contract.employee.supervisor_id)
    }

    const recipients = [...new Set([...supervisors, ...adminIds])]

    for (const recipientId of recipients) {
      await createNotification(
        prisma,
        recipientId,
        'CONTRACT_EXPIRY',
        `Contract for ${contract.employee.name} expires on ${contract.date_fin?.toISOString().split('T')[0]}.`,
        'Contract',
        contract.id_contract,
      )
    }
  }
}
