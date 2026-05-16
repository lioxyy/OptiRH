import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import type { CreateEmployeeDTO, UpdateEmployeeDTO, CreateDepartmentDTO, UpdateDepartmentDTO } from './employees.types'
import type { RequestUser } from '../../middleware/authenticate'
import bcrypt from 'bcryptjs'

export async function getEmployees(requestUser: RequestUser) {
  if (requestUser.role === 'Admin') {
    return prisma.employee.findMany({
      include: { department: true, supervisor: { select: { id_emp: true, name: true } } },
    })
  }
  if (requestUser.role === 'Agent') {
    return prisma.employee.findMany({
      where: { id_dept: requestUser.id_dept },
      include: { department: true, supervisor: { select: { id_emp: true, name: true } } },
    })
  }
  return prisma.employee.findMany({
    where: { id_emp: requestUser.id_emp },
    include: { department: true },
  })
}

export async function getEmployeeById(id: number, requestUser: RequestUser) {
  const employee = await prisma.employee.findUnique({ where: { id_emp: id } })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)
  if (requestUser.role === 'Agent' && employee.id_dept !== requestUser.id_dept) {
    throw new AppError('FORBIDDEN', 403)
  }
  return employee
}

export async function createEmployee(data: CreateEmployeeDTO, actorId: number) {
  const { password, ...rest } = data
  const password_hash = await bcrypt.hash(password, 10)

  return prisma.$transaction(async (tx) => {
    const existing = await tx.employee.findUnique({ where: { email: rest.email } })
    if (existing) throw new AppError('EMAIL_ALREADY_EXISTS', 409)

    const employee = await tx.employee.create({
      data: { ...rest, password_hash },
    })
    await writeAuditLog(tx, actorId, 'CREATE', 'Employee', employee.id_emp, employee)
    return employee
  })
}

export async function updateEmployee(id: number, data: UpdateEmployeeDTO, requestUser: RequestUser) {
  const employee = await prisma.employee.findUnique({ where: { id_emp: id } })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  if (requestUser.role === 'Agent' && employee.id_dept !== requestUser.id_dept) {
    throw new AppError('FORBIDDEN', 403)
  }

  const { password, ...rest } = data
  const updateData = password
    ? { ...rest, password_hash: await bcrypt.hash(password, 10) }
    : rest

  return prisma.$transaction(async (tx) => {
    const updated = await tx.employee.update({
      where: { id_emp: id },
      data: updateData,
    })
    await writeAuditLog(tx, requestUser.id_emp, 'UPDATE', 'Employee', id, updated)
    return updated
  })
}

export async function deleteEmployee(id: number, actorId: number) {
  const employee = await prisma.employee.findUnique({ where: { id_emp: id } })
  if (!employee) throw new AppError('EMPLOYEE_NOT_FOUND', 404)

  return prisma.$transaction(async (tx) => {
    await tx.employee.delete({ where: { id_emp: id } })
    await writeAuditLog(tx, actorId, 'DELETE', 'Employee', id, employee)
  })
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

export async function getDepartments(requestUser: RequestUser) {
  if (requestUser.role === 'Employee') throw new AppError('FORBIDDEN', 403)
  return prisma.department.findMany()
}

export async function createDepartment(data: CreateDepartmentDTO) {
  return prisma.department.create({ data })
}

export async function updateDepartment(id: number, data: UpdateDepartmentDTO) {
  const dept = await prisma.department.findUnique({ where: { id_dept: id } })
  if (!dept) throw new AppError('DEPARTMENT_NOT_FOUND', 404)
  return prisma.department.update({ where: { id_dept: id }, data })
}

interface OrgNode {
  id_emp: number
  name: string
  role: string
  supervisor_id: number | null
  id_dept: number
  children: OrgNode[]
}

function buildTree(employees: OrgNode[], parentId: number | null): OrgNode[] {
  return employees
    .filter(e => e.supervisor_id === parentId)
    .map(e => ({ ...e, children: buildTree(employees, e.id_emp) }))
}

export async function getOrgChart() {
  const employees = await prisma.employee.findMany({
    select: {
      id_emp: true,
      name: true,
      role: true,
      supervisor_id: true,
      id_dept: true,
    },
  })

  return buildTree(employees as OrgNode[], null)
}
