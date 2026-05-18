/**
 * leaves-test-data.ts — Seed and Test Data for OptiRH (Leaves Module)
 *
 * Test Accounts:
 *  Admin   → admin@optirh.com      / admin123
 *  Agent   → agent@optirh.com      / agent123
 *  Employee → alice@optirh.com      / emp123   (normal balance)
 *  Employee → bob@optirh.com        / emp123   (balance nearly exhausted)
 *  Employee → carol@optirh.com      / emp123   (balance exhausted — limit case)
 *  Employee → david@optirh.com      / emp123   (no initialized balance)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed database for leaves...')

  // ─── 1. Departments ───────────────────────────────────────────────────────
  const deptRH = await prisma.department.upsert({
    where: { id_dept: 1 },
    update: { name: 'Human Resources' },
    create: { name: 'Human Resources', description: 'HR Department' },
  })

  const deptIT = await prisma.department.upsert({
    where: { id_dept: 2 },
    update: { name: 'Information Technology' },
    create: { name: 'Information Technology', description: 'IT Department' },
  })

  const deptFIN = await prisma.department.upsert({
    where: { id_dept: 3 },
    update: { name: 'Finance' },
    create: { name: 'Finance', description: 'Finance Department' },
  })

  // ─── 2. Leave Types ─────────────────────────────────────────────────────
  const leaveTypes: Record<string, number> = {}

  const typesData = [
    { name: 'Annual Leave',       default_days: 30, is_cumulative: true  },
    { name: 'Sick Leave',         default_days: 15, is_cumulative: false },
    { name: 'Maternity Leave',    default_days: 90, is_cumulative: false },
    { name: 'Unpaid Leave',       default_days: 0,  is_cumulative: false },
  ]

  for (const t of typesData) {
    const lt = await prisma.leaveType.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    })
    leaveTypes[t.name] = lt.id_type
  }

  const annualId   = leaveTypes['Annual Leave']
  const sickId     = leaveTypes['Sick Leave']

  // ─── 3. Employees ───────────────────────────────────────────────────────────
  const hash = {
    admin: await bcrypt.hash('admin123', 10),
    agent: await bcrypt.hash('agent123', 10),
    emp:   await bcrypt.hash('emp123',   10),
  }

  const year = new Date().getFullYear()

  // Admin
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
      id_dept: deptRH.id_dept,
    },
  })

  // Agent RH
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
      id_dept: deptRH.id_dept,
    },
  })

  // Alice — normal balance
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
      id_dept: deptIT.id_dept,
      supervisor_id: agent.id_emp,
    },
  })

  // Bob — balance nearly exhausted
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
      id_dept: deptIT.id_dept,
      supervisor_id: agent.id_emp,
    },
  })

  // Carol — balance exhausted → limit case
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
      id_dept: deptFIN.id_dept,
      supervisor_id: admin.id_emp,
    },
  })

  // David — no initial balance (new, not yet initialized)
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
      id_dept: deptFIN.id_dept,
      supervisor_id: admin.id_emp,
    },
  })

  // ─── 4. Leave Balances ──────────────────────────────────────────────────
  async function upsertBalance(
    id_emp: number, id_type: number,
    allocated: number, consumed: number, carried_over = 0,
  ) {
    await prisma.congeBalance.upsert({
      where: { id_emp_id_type_year: { id_emp, id_type, year } },
      update: { allocated, consumed, carried_over },
      create:  { id_emp, id_type, year, allocated, consumed, carried_over },
    })
  }

  // Alice — 30 allocated + 5 carried over, 15 consumed → 20 remaining ✅
  await upsertBalance(alice.id_emp, annualId,  30, 15, 5)
  await upsertBalance(alice.id_emp, sickId,    15,  2, 0)

  // Bob — 30 allocated, 27 consumed → 3 remaining ⚠️
  await upsertBalance(bob.id_emp,   annualId,  30, 27, 0)
  await upsertBalance(bob.id_emp,   sickId,    15,  0, 0)

  // Carol — 30 allocated, 30 consumed → 0 remaining ❌
  await upsertBalance(carol.id_emp, annualId,  30, 30, 0)
  await upsertBalance(carol.id_emp, sickId,    15, 15, 0)

  // David — no initial balance

  // ─── 5. Leave Requests ──────────────────────────────────────────
  async function upsertConge(data: {
    id_emp: number; id_type: number
    date_deb: Date; date_fin: Date
    status: string; approved_by?: number
  }) {
    const existing = await prisma.conge.findFirst({
      where: { id_emp: data.id_emp, date_deb: data.date_deb, id_type: data.id_type },
    })
    if (!existing) {
      await prisma.conge.create({ data: { ...data, approved_by: data.approved_by ?? null } })
    }
  }

  // Alice: one approved (past), one pending (future)
  await upsertConge({
    id_emp: alice.id_emp, id_type: annualId,
    date_deb: new Date(`${year}-03-01`), date_fin: new Date(`${year}-03-15`),
    status: 'Approved', approved_by: admin.id_emp,
  })
  await upsertConge({
    id_emp: alice.id_emp, id_type: sickId,
    date_deb: new Date(`${year}-02-10`), date_fin: new Date(`${year}-02-11`),
    status: 'Approved', approved_by: agent.id_emp,
  })
  await upsertConge({
    id_emp: alice.id_emp, id_type: annualId,
    date_deb: new Date(`${year}-07-01`), date_fin: new Date(`${year}-07-05`),
    status: 'Pending',
  })

  // Bob: one approved (long), one rejected, one pending
  await upsertConge({
    id_emp: bob.id_emp, id_type: annualId,
    date_deb: new Date(`${year}-01-06`), date_fin: new Date(`${year}-02-01`),
    status: 'Approved', approved_by: admin.id_emp,
  })
  await upsertConge({
    id_emp: bob.id_emp, id_type: annualId,
    date_deb: new Date(`${year}-08-01`), date_fin: new Date(`${year}-08-05`),
    status: 'Rejected', approved_by: admin.id_emp,
  })
  await upsertConge({
    id_emp: bob.id_emp, id_type: annualId,
    date_deb: new Date(`${year}-09-01`), date_fin: new Date(`${year}-09-03`),
    status: 'Pending',
  })

  // Carol: exhausted balance — all past requests are approved
  await upsertConge({
    id_emp: carol.id_emp, id_type: annualId,
    date_deb: new Date(`${year}-01-02`), date_fin: new Date(`${year}-01-31`),
    status: 'Approved', approved_by: admin.id_emp,
  })
  await upsertConge({
    id_emp: carol.id_emp, id_type: sickId,
    date_deb: new Date(`${year}-04-01`), date_fin: new Date(`${year}-04-15`),
    status: 'Approved', approved_by: agent.id_emp,
  })

  // ─── 6. Update Department Manager ───────────────────────────────
  await prisma.department.update({
    where: { id_dept: deptRH.id_dept },
    data: { manager_id: admin.id_emp },
  })

  // ─── 7. Contracts & Payslips ──────────────────────────────────────────
  console.log('📄 Seeding contracts and payslips...')
  
  const adminContract = await prisma.contract.upsert({
    where: { id_contract: 9901 },
    update: { salaire_base: 150000, type: 'CDI', status: 'Active' },
    create: {
      id_contract: 9901, id_emp: admin.id_emp, type: 'CDI',
      salaire_base: 150000, start_date: new Date('2015-01-01'), status: 'Active'
    }
  })

  const aliceContract = await prisma.contract.upsert({
    where: { id_contract: 9902 },
    update: { salaire_base: 85000, type: 'CDI', status: 'Active' },
    create: {
      id_contract: 9902, id_emp: alice.id_emp, type: 'CDI',
      salaire_base: 85000, start_date: new Date('2021-03-01'), status: 'Active'
    }
  })

  const agentContract = await prisma.contract.upsert({
    where: { id_contract: 9903 },
    update: { salaire_base: 110000, type: 'CDI', status: 'Active' },
    create: {
      id_contract: 9903, id_emp: agent.id_emp, type: 'CDI',
      salaire_base: 110000, start_date: new Date('2018-06-01'), status: 'Active'
    }
  })

  // Generate 4 months of payslips for Admin
  const months = ['01-2026', '02-2026', '03-2026', '04-2026']
  let bonus = 0
  for (const m of months) {
    bonus += 5000 // Increasing bonus for visual chart differences
    await prisma.salaire.upsert({
      where: { id_emp_month_year: { id_emp: admin.id_emp, month_year: m } },
      update: { amount_final: 150000 + bonus, bonus_amount: bonus, status: 'Paid' },
      create: {
        id_emp: admin.id_emp, id_contract: adminContract.id_contract,
        month_year: m, bonus_amount: bonus, absence_deductions: 0,
        amount_final: 150000 + bonus, status: 'Paid'
      }
    })
  }

  // Generate 4 months for Alice (with some deductions)
  await prisma.salaire.upsert({
    where: { id_emp_month_year: { id_emp: alice.id_emp, month_year: '01-2026' } },
    update: {}, create: { id_emp: alice.id_emp, id_contract: aliceContract.id_contract, month_year: '01-2026', bonus_amount: 0, absence_deductions: 0, amount_final: 85000, status: 'Paid' }
  })
  await prisma.salaire.upsert({
    where: { id_emp_month_year: { id_emp: alice.id_emp, month_year: '02-2026' } },
    update: {}, create: { id_emp: alice.id_emp, id_contract: aliceContract.id_contract, month_year: '02-2026', bonus_amount: 15000, absence_deductions: 0, amount_final: 100000, status: 'Paid' }
  })
  await prisma.salaire.upsert({
    where: { id_emp_month_year: { id_emp: alice.id_emp, month_year: '03-2026' } },
    update: {}, create: { id_emp: alice.id_emp, id_contract: aliceContract.id_contract, month_year: '03-2026', bonus_amount: 0, absence_deductions: 12000, amount_final: 73000, status: 'Validated' }
  })
  await prisma.salaire.upsert({
    where: { id_emp_month_year: { id_emp: alice.id_emp, month_year: '04-2026' } },
    update: {}, create: { id_emp: alice.id_emp, id_contract: aliceContract.id_contract, month_year: '04-2026', bonus_amount: 0, absence_deductions: 0, amount_final: 85000, status: 'Generated' }
  })

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n✅ Database seeded successfully!\n')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  TEST ACCOUNTS')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  👑 Admin   : admin@optirh.com     / admin123')
  console.log('  🧑‍💼 Agent   : agent@optirh.com     / agent123')
  console.log('  ─────────────────────────────────────────────────────────')
  console.log('  👤 Alice   : alice@optirh.com     / emp123  (20d remaining ✅)')
  console.log('  👤 Bob     : bob@optirh.com       / emp123  ( 3d remaining ⚠️)')
  console.log('  👤 Carol   : carol@optirh.com     / emp123  ( 0d remaining ❌)')
  console.log('  👤 David   : david@optirh.com     / emp123  (new, no balance)')
  console.log('═══════════════════════════════════════════════════════════\n')
}

main().catch(console.error).finally(() => prisma.$disconnect())
