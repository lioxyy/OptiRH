/**
 * payroll-test-data.ts — Integrated Seed and Test Data for OptiRH
 * 
 * This script populates test data for:
 *   1. CDI and CDD Contracts (active and soft-archived trial periods).
 *   2. Attendance logs for May 2026 (Present, Late check-ins past 09:00, and Unjustified Absences).
 *   3. Massrouf Salary Advances (limit control at 2 requests/year, approved/pending statuses).
 *   4. Historical and ready-to-calculate Payroll logs using the exact academic formula.
 *
 * Test Accounts:
 *  Admin   → admin@optirh.com      / admin123
 *  Agent   → agent@optirh.com      / agent123
 *  Employee → alice@optirh.com      / emp123   (Normal Case: CDI, 85K Salary, Perfect Attendance logs)
 *  Employee → bob@optirh.com        / emp123   (Absence & Lateness Deduction Case: CDI, 90K, 4 Absences, 2 Lates, 1 Massrouf)
 *  Employee → carol@optirh.com      / emp123   (Massrouf Limit Exhausted Case: CDD, 2 Requests logged, 0 Left)
 *  Employee → david@optirh.com      / emp123   (No Contract / Active Terms Case: David has NO active contract)
 *  Employee → elias@optirh.com      / emp123   (Archived History Case: 1 Archived contract + 1 Active contract)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting full database reset and seed for payroll, contracts, absences & massrouf...')

  // ─── 1. Clean ALL database tables completely to prevent clutter ─────────
  await prisma.auditLog.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.participationFormation.deleteMany({})
  await prisma.formation.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.evaluation.deleteMany({})
  await prisma.absence.deleteMany({})
  await prisma.conge.deleteMany({})
  await prisma.congeBalance.deleteMany({})
  await prisma.attendance.deleteMany({})
  await prisma.massrouf.deleteMany({})
  await prisma.salaire.deleteMany({})
  await prisma.contract.deleteMany({})
  await prisma.entretien.deleteMany({})
  await prisma.candidat.deleteMany({})
  
  // Nullify manager and supervisor relations first to avoid foreign key constraints in SQLite
  await prisma.department.updateMany({ data: { manager_id: null } })
  await prisma.employee.updateMany({ data: { supervisor_id: null } })

  await prisma.employee.deleteMany({})
  await prisma.department.deleteMany({})
  await prisma.leaveType.deleteMany({})
  await prisma.systemSetting.deleteMany({})

  // ─── 2. Leave Types (Seeded for reference) ────────────────────────────────
  const leaveTypes: Record<string, number> = {}
  const typesData = [
    { name: 'Annual Leave',       default_days: 30, is_cumulative: true  },
    { name: 'Sick Leave',         default_days: 15, is_cumulative: false },
    { name: 'Maternity Leave',    default_days: 90, is_cumulative: false },
    { name: 'Unpaid Leave',       default_days: 0,  is_cumulative: false },
  ]

  for (const t of typesData) {
    const lt = await prisma.leaveType.create({ data: t })
    leaveTypes[t.name] = lt.id_type
  }

  const annualId = leaveTypes['Annual Leave']
  const sickId = leaveTypes['Sick Leave']

  // ─── 2. Departments ───────────────────────────────────────────────────────
  const deptRH = await prisma.department.upsert({
    where: { id_dept: 1 },
    update: {},
    create: { name: 'Human Resources', description: 'HR Department' },
  })

  const deptIT = await prisma.department.upsert({
    where: { id_dept: 2 },
    update: {},
    create: { name: 'Information Technology', description: 'IT Department' },
  })

  const deptFIN = await prisma.department.upsert({
    where: { id_dept: 3 },
    update: {},
    create: { name: 'Finance', description: 'Finance Department' },
  })

  // ─── 3. Global System settings (lateness check threshold) ─────────────────
  await prisma.systemSetting.create({
    data: { key: 'office_start_time', value: '09:00' },
  })

  // ─── 4. Employees upserting (preserving leaves references) ────────────────
  const hash = {
    admin: await bcrypt.hash('admin123', 10),
    agent: await bcrypt.hash('agent123', 10),
    emp:   await bcrypt.hash('emp123',   10),
  }

  const admin = await prisma.employee.upsert({
    where: { email: 'admin@optirh.com' },
    update: {},
    create: {
      name: 'Karim Mansouri',
      email: 'admin@optirh.com',
      password_hash: hash.admin,
      role: 'Admin',
      gender: 'M',
      phone: '0555-00-0001',
      date_birth: new Date('1985-03-15'),
      date_employment: new Date('2015-01-01'),
      departments: { connect: { id_dept: deptRH.id_dept } },
    },
  })

  const agent = await prisma.employee.upsert({
    where: { email: 'agent@optirh.com' },
    update: {},
    create: {
      name: 'Sara Benmoussa',
      email: 'agent@optirh.com',
      password_hash: hash.agent,
      role: 'Agent',
      gender: 'F',
      phone: '0555-00-0002',
      date_birth: new Date('1990-07-22'),
      date_employment: new Date('2018-06-01'),
      departments: { connect: { id_dept: deptRH.id_dept } },
    },
  })

  const alice = await prisma.employee.upsert({
    where: { email: 'alice@optirh.com' },
    update: {},
    create: {
      name: 'Alice Tlemçani',
      email: 'alice@optirh.com',
      password_hash: hash.emp,
      role: 'Employee',
      gender: 'F',
      phone: '0555-00-0010',
      date_birth: new Date('1995-04-10'),
      date_employment: new Date('2021-03-01'),
      departments: { connect: { id_dept: deptIT.id_dept } },
      supervisor_id: agent.id_emp,
    },
  })

  const bob = await prisma.employee.upsert({
    where: { email: 'bob@optirh.com' },
    update: {},
    create: {
      name: 'Bob Merazga',
      email: 'bob@optirh.com',
      password_hash: hash.emp,
      role: 'Employee',
      gender: 'M',
      phone: '0555-00-0011',
      date_birth: new Date('1993-11-05'),
      date_employment: new Date('2020-09-01'),
      departments: { connect: { id_dept: deptIT.id_dept } },
      supervisor_id: agent.id_emp,
    },
  })

  const carol = await prisma.employee.upsert({
    where: { email: 'carol@optirh.com' },
    update: {},
    create: {
      name: 'Carol Haddad',
      email: 'carol@optirh.com',
      password_hash: hash.emp,
      role: 'Employee',
      gender: 'F',
      phone: '0555-00-0012',
      date_birth: new Date('1998-08-20'),
      date_employment: new Date('2023-01-15'),
      departments: { connect: { id_dept: deptFIN.id_dept } },
      supervisor_id: admin.id_emp,
    },
  })

  const david = await prisma.employee.upsert({
    where: { email: 'david@optirh.com' },
    update: {},
    create: {
      name: 'David Oukil',
      email: 'david@optirh.com',
      password_hash: hash.emp,
      role: 'Employee',
      gender: 'M',
      phone: '0555-00-0013',
      date_birth: new Date('2000-01-30'),
      date_employment: new Date('2026-05-01'),
      departments: { connect: { id_dept: deptFIN.id_dept } },
      supervisor_id: admin.id_emp,
    },
  })

  const elias = await prisma.employee.upsert({
    where: { email: 'elias@optirh.com' },
    update: {},
    create: {
      name: 'Elias Ziani',
      email: 'elias@optirh.com',
      password_hash: hash.emp,
      role: 'Employee',
      gender: 'M',
      phone: '0555-00-0014',
      date_birth: new Date('1996-10-12'),
      date_employment: new Date('2024-02-01'),
      departments: { connect: { id_dept: deptIT.id_dept } },
      supervisor_id: agent.id_emp,
    },
  })

  // ─── 5. Contracts Seeding ─────────────────────────────────────────────────
  // Karim (Admin)
  await prisma.contract.create({
    data: {
      type: 'CDI',
      date_deb: new Date('2015-01-01'),
      salaire_base: 120000,
      status: 'Active',
      id_emp: admin.id_emp,
    },
  })

  // Sara (Agent)
  await prisma.contract.create({
    data: {
      type: 'CDI',
      date_deb: new Date('2018-06-01'),
      salaire_base: 95000,
      status: 'Active',
      id_emp: agent.id_emp,
    },
  })

  // Alice CDI (Normal case: 85,000 DZD)
  const contractAlice = await prisma.contract.create({
    data: {
      type: 'CDI',
      date_deb: new Date('2021-03-01'),
      salaire_base: 85000,
      status: 'Active',
      id_emp: alice.id_emp,
    },
  })

  // Bob CDI (Deduction Case: 90,000 DZD)
  const contractBob = await prisma.contract.create({
    data: {
      type: 'CDI',
      date_deb: new Date('2020-09-01'),
      salaire_base: 90000,
      status: 'Active',
      id_emp: bob.id_emp,
    },
  })

  // Carol CDD (Massrouf Limit Case: 75,000 DZD)
  const contractCarol = await prisma.contract.create({
    data: {
      type: 'CDD',
      date_deb: new Date('2026-01-01'),
      date_fin: new Date('2026-12-31'),
      salaire_base: 75000,
      status: 'Active',
      id_emp: carol.id_emp,
    },
  })

  // Elias: 1 Archived contract + 1 Active contract
  await prisma.contract.create({
    data: {
      type: 'Trial',
      date_deb: new Date('2024-02-01'),
      date_fin: new Date('2024-05-01'),
      salaire_base: 50000,
      status: 'Archived',
      id_emp: elias.id_emp,
    },
  })

  const contractElias = await prisma.contract.create({
    data: {
      type: 'CDI',
      date_deb: new Date('2024-05-02'),
      salaire_base: 98000,
      status: 'Active',
      id_emp: elias.id_emp,
    },
  })

  // Note: David has NO contracts. Perfect to test "No contract details found" fallback.

  // ─── 6. Massrouf Salary Advances ─────────────────────────────────────────
  // Bob: Has 1 approved advance of 15,000 DZD (will be deducted in May 2026)
  await prisma.massrouf.create({
    data: {
      amount: 15000,
      date_request: new Date('2026-05-05'),
      status: 'Approved',
      id_emp: bob.id_emp,
    },
  })

  // Carol: Has 2 requests logged (1 Approved + 1 Pending) -> Yearly limit exhausted! (0 requests remaining)
  await prisma.massrouf.create({
    data: {
      amount: 10000,
      date_request: new Date('2026-02-15'),
      status: 'Approved',
      id_emp: carol.id_emp,
    },
  })
  await prisma.massrouf.create({
    data: {
      amount: 5000,
      date_request: new Date('2026-05-10'),
      status: 'Pending',
      id_emp: carol.id_emp,
    },
  })

  // ─── 7. Attendance & Absences (Period: May 2026) ────────────────────────
  const targetMonth = '2026-05'

  // Alice: 5 check-ins (all Present, standard)
  for (let d = 11; d <= 15; d++) {
    await prisma.attendance.create({
      data: {
        date: new Date(`${targetMonth}-${d}`),
        clock_in: new Date(`${targetMonth}-${d}T08:30:00`),
        clock_out: new Date(`${targetMonth}-${d}T17:00:00`),
        status: 'Present',
        work_hours: 8.5,
        id_emp: alice.id_emp,
      },
    })
  }

  // Bob: 2 Present, 2 Late, 4 Unjustified Absences
  // Days 11-12: Present
  for (let d = 11; d <= 12; d++) {
    await prisma.attendance.create({
      data: {
        date: new Date(`${targetMonth}-${d}`),
        clock_in: new Date(`${targetMonth}-${d}T08:45:00`),
        clock_out: new Date(`${targetMonth}-${d}T17:00:00`),
        status: 'Present',
        work_hours: 8.25,
        id_emp: bob.id_emp,
      },
    })
  }
  // Days 13-14: Late (after 09:00 settings start time)
  for (let d = 13; d <= 14; d++) {
    await prisma.attendance.create({
      data: {
        date: new Date(`${targetMonth}-${d}`),
        clock_in: new Date(`${targetMonth}-${d}T09:20:00`),
        clock_out: new Date(`${targetMonth}-${d}T17:00:00`),
        status: 'Late',
        work_hours: 7.66,
        notes: 'Commute traffic',
        id_emp: bob.id_emp,
      },
    })
  }
  // Days 15-18: Absent (4 unjustified absences -> deductions calculation)
  for (let d = 15; d <= 18; d++) {
    await prisma.attendance.create({
      data: {
        date: new Date(`${targetMonth}-${d}`),
        clock_in: null,
        clock_out: null,
        status: 'Absent',
        work_hours: 0,
        id_emp: bob.id_emp,
      },
    })
  }

  // Elias: 1 punch Present
  await prisma.attendance.create({
    data: {
      date: new Date(`${targetMonth}-12`),
      clock_in: new Date(`${targetMonth}-12T08:50:00`),
      clock_out: new Date(`${targetMonth}-12T17:00:00`),
      status: 'Present',
      work_hours: 8.16,
      id_emp: elias.id_emp,
    },
  })

  // ─── 8. Salaire (Payroll Historiography) ────────────────────────────────
  // Seed April 2026 pre-calculated payslips for testing dashboard histories
  // Alice: Perfect April (Paid)
  await prisma.salaire.create({
    data: {
      month_year: '04-2026',
      bonus_amount: 0,
      absence_deductions: 0,
      amount_final: 85000,
      status: 'Paid',
      id_emp: alice.id_emp,
      id_contract: contractAlice.id_contract,
    },
  })

  // Bob: Had 1 absence in April (Validated, ready to be marked Paid)
  await prisma.salaire.create({
    data: {
      month_year: '04-2026',
      bonus_amount: 0,
      absence_deductions: 3000,
      amount_final: 87000,
      status: 'Validated',
      id_emp: bob.id_emp,
      id_contract: contractBob.id_contract,
    },
  })

  // Elias: Had active trial contract (Generated, ready to be validated)
  await prisma.salaire.create({
    data: {
      month_year: '04-2026',
      bonus_amount: 0,
      absence_deductions: 0,
      amount_final: 98000,
      status: 'Generated',
      id_emp: elias.id_emp,
      id_contract: contractElias.id_contract,
    },
  })

  console.log('\n✨ OptiRH Payroll & Contracts seed database generated successfully!')
  console.log('══════════════════════════════════════════════════════════════════════════')
  console.log('  👑 HR Admin: admin@optirh.com  / admin123')
  console.log('  🧑‍💼 HR Agent: agent@optirh.com  / agent123')
  console.log('  ────────────────────────────────────────────────────────────────────────')
  console.log('  👤 ALICE (Normal Case):')
  console.log('     • CDI contract active (Base: 85,000 DZD)')
  console.log('     • 5 standard check-ins for May 2026 (0 lateness, 0 absences)')
  console.log('     • Massroufs used: 0/2 requests used')
  console.log('  ────────────────────────────────────────────────────────────────────────')
  console.log('  👤 BOB (Deductions & Absences Case):')
  console.log('     • CDI contract active (Base: 90,000 DZD)')
  console.log('     • May 2026 logs: 2 Lates, 4 unjustified absences (-12,000 DZD deduction)')
  console.log('     • 1 Approved Massrouf advance subtracted (-15,000 DZD)')
  console.log('     • Expected May Payroll formula net: 90K - 12K - 15K = 63,000 DZD!')
  console.log('  ────────────────────────────────────────────────────────────────────────')
  console.log('  👤 CAROL (Exhausted Massrouf Case):')
  console.log('     • CDD contract active (Base: 75,000 DZD)')
  console.log('     • Massroufs used: 2/2 requests logged (1 Pending, 1 Approved)')
  console.log('     • UI block: "0/2 remaining requests left", submitting forms is blocked.')
  console.log('  ────────────────────────────────────────────────────────────────────────')
  console.log('  👤 DAVID (No active contract / Terms Case):')
  console.log('     • Has no contract logged!')
  console.log('     • Allows testing fallback warning messages when running payroll calculations.')
  console.log('  ────────────────────────────────────────────────────────────────────────')
  console.log('  👤 ELIAS (Archived History Case):')
  console.log('     • 1 Archived Trial contract + 1 Active CDI contract')
  console.log('     • Demonstrates soft-archiving contracts history.')
  console.log('══════════════════════════════════════════════════════════════════════════\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
