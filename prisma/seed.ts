/**
 * seed.ts — Données de test pour OptiRH
 *
 * Comptes créés :
 *  Admin   → admin@optirh.com      / admin123
 *  Agent   → agent@optirh.com      / agent123
 *  Employé → alice@optirh.com      / emp123   (solde normal)
 *  Employé → bob@optirh.com        / emp123   (solde presque épuisé)
 *  Employé → carol@optirh.com      / emp123   (solde épuisé — cas limite)
 *  Employé → david@optirh.com      / emp123   (aucun solde initialisé)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  // ─── 1. Départements ───────────────────────────────────────────────────────
  const deptRH = await prisma.department.upsert({
    where: { id_dept: 1 },
    update: { name: 'Ressources Humaines' },
    create: { name: 'Ressources Humaines', description: 'Service RH' },
  })

  const deptIT = await prisma.department.upsert({
    where: { id_dept: 2 },
    update: { name: 'Informatique' },
    create: { name: 'Informatique', description: 'Service IT' },
  })

  const deptFIN = await prisma.department.upsert({
    where: { id_dept: 3 },
    update: { name: 'Finance' },
    create: { name: 'Finance', description: 'Service Finance' },
  })

  // ─── 2. Types de congé ─────────────────────────────────────────────────────
  const leaveTypes: Record<string, number> = {}

  const typesData = [
    { name: 'Congé annuel',       default_days: 30, is_cumulative: true  },
    { name: 'Congé maladie',      default_days: 15, is_cumulative: false },
    { name: 'Congé maternité',    default_days: 90, is_cumulative: false },
    { name: 'Congé sans solde',   default_days: 0,  is_cumulative: false },
  ]

  for (const t of typesData) {
    const lt = await prisma.leaveType.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    })
    leaveTypes[t.name] = lt.id_type
  }

  const annualId   = leaveTypes['Congé annuel']
  const sickId     = leaveTypes['Congé maladie']

  // ─── 3. Employés ───────────────────────────────────────────────────────────
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
      supervisor_id: admin.id_emp,
    },
  })

  // Alice — solde normal (15 consommés sur 30, 5 de report)
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

  // Bob — solde presque épuisé (27 consommés sur 30)
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

  // Carol — solde épuisé (30/30) → cas limite
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

  // David — aucun solde (nouveau, pas encore initialisé)
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

  // ─── 4. Balances de congé ──────────────────────────────────────────────────
  // Helper pour upsert balance
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

  // Alice — 30 alloués + 5 report, 15 consommés → 20 restants ✅
  await upsertBalance(alice.id_emp, annualId,  30, 15, 5)
  await upsertBalance(alice.id_emp, sickId,    15,  2, 0)

  // Bob — 30 alloués, 27 consommés → 3 restants ⚠️
  await upsertBalance(bob.id_emp,   annualId,  30, 27, 0)
  await upsertBalance(bob.id_emp,   sickId,    15,  0, 0)

  // Carol — 30 alloués, 30 consommés → 0 restants ❌ (cas limite)
  await upsertBalance(carol.id_emp, annualId,  30, 30, 0)
  await upsertBalance(carol.id_emp, sickId,    15, 15, 0)

  // David — pas de balance (sera créé auto au premier POST /requests)

  // ─── 5. Demandes de congé variées ──────────────────────────────────────────
  // Helper pour upsert conge
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

  // Alice : une demande approuvée (passée), une en attente (future)
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

  // Bob : une approuvée (longue — vide presque tout le solde), une rejetée
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

  // Carol : solde épuisé — toutes ses demandes passées sont approuvées
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

  // David : aucune demande — compte vierge

  // ─── 6. Mettre à jour manager du département ───────────────────────────────
  await prisma.department.update({
    where: { id_dept: deptRH.id_dept },
    data: { manager_id: admin.id_emp },
  })

  // ─── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed terminé !\n')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  COMPTES DE TEST')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  👑 Admin   : admin@optirh.com     / admin123')
  console.log('  🧑‍💼 Agent   : agent@optirh.com     / agent123')
  console.log('  ─────────────────────────────────────────────────────────')
  console.log('  👤 Alice   : alice@optirh.com     / emp123  (20j restants ✅)')
  console.log('  👤 Bob     : bob@optirh.com       / emp123  ( 3j restants ⚠️)')
  console.log('  👤 Carol   : carol@optirh.com     / emp123  ( 0j restants ❌)')
  console.log('  👤 David   : david@optirh.com     / emp123  (nouveau, sans solde)')
  console.log('═══════════════════════════════════════════════════════════\n')
}

main().catch(console.error).finally(() => prisma.$disconnect())
