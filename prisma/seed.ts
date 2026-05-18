import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // 1. Departments
  const deptData = [
    { name: 'Direction Générale', description: 'Executive board' },
    { name: 'Ressources Humaines', description: 'HR and recruitment' },
    { name: 'Informatique & IT', description: 'Development' },
    { name: 'Ventes', description: 'Sales' },
    { name: 'Logistique', description: 'Operations' },
  ]

  for (const d of deptData) {
    await prisma.department.create({ data: d })
  }
  const allDepts = await prisma.department.findMany()

  // 2. Leave Types
  const leaveTypes = [
    { name: 'Vacances', default_days: 22 },
    { name: 'Maladie', default_days: 15 },
    { name: 'Maternité', default_days: 98 },
  ]
  for (const lt of leaveTypes) {
    await prisma.leaveType.create({ data: lt })
  }
  const allLeaveTypes = await prisma.leaveType.findMany()

  // 3. Employees (50)
  const names = ['Amina', 'Mohamed', 'Sara', 'Karim', 'Lina', 'Omar', 'Siham', 'Ryad', 'Hamza', 'Leila']
  const surnames = ['Benali', 'Brahimi', 'Khadra', 'Mansouri', 'Zidane']
  const roles = ['Admin', 'Agent', 'Employee']

  const employees = []
  for (let i = 0; i < 50; i++) {
    const dept = allDepts[i % allDepts.length]
    const emp = await prisma.employee.create({
      data: {
        name: `${names[i % names.length]} ${surnames[i % surnames.length]} ${i}`,
        email: `user${i}@optirh.dz`,
        password_hash: 'hashed_pass',
        phone: `0550${100000 + i}`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        date_birth: new Date(1980 + (i % 20), 0, 1),
        date_employment: new Date(2023, 0, 1),
        role: roles[i % roles.length],
        departments: { connect: { id_dept: dept.id_dept } }
      }
    })
    employees.push(emp)
  }

  // 4. Contracts & Salaires
  for (const emp of employees) {
    const contract = await prisma.contract.create({
      data: {
        type: 'CDI',
        salaire_base: 60000 + (Math.random() * 40000),
        date_deb: new Date(2023, 0, 1),
        id_emp: emp.id_emp,
        status: 'Active'
      }
    })

    // Last 12 months salary
    for (let m = 0; m < 12; m++) {
      await prisma.salaire.create({
        data: {
          month_year: new Date(2024, m, 1).toISOString().slice(0, 7),
          amount_final: contract.salaire_base + 2000,
          id_emp: emp.id_emp,
          id_contract: contract.id_contract
        }
      })
    }
  }

  // 5. Attendance & Absences
  for (const emp of employees) {
    for (let d = 1; d <= 20; d++) {
      const date = new Date(2024, 4, d) // May 2024
      if (date.getDay() === 5 || date.getDay() === 6) continue

      if (Math.random() > 0.1) {
        await prisma.attendance.create({
          data: {
            id_emp: emp.id_emp,
            date,
            clock_in: new Date(date.setHours(8, 0)),
            clock_out: new Date(date.setHours(17, 0)),
            status: 'Present'
          }
        })
      } else {
        await prisma.absence.create({
          data: {
            date_absence: date,
            id_emp: emp.id_emp,
            id_type: allLeaveTypes[0].id_type,
            is_justified: Math.random() > 0.5,
            recorded_by: employees[0].id_emp
          }
        })
      }
    }
  }

  // 6. Recruitment (Candidats & Entretiens)
  const candStatuses = ['Pending', 'Accepted', 'Rejected']
  for (let i = 0; i < 15; i++) {
    const cand = await prisma.candidat.create({
      data: {
        name: `Candidate ${i}`,
        email: `cand${i}@gmail.com`,
        status: candStatuses[i % 3],
        post_applied: 'Engineer',
        date_candidature: new Date()
      }
    })

    await prisma.entretien.create({
      data: {
        id_cand: cand.id_cand,
        id_agent: employees[0].id_emp,
        date_heure: new Date(),
        status: 'Scheduled',
        result_notes: 'Promising'
      }
    })
  }

  // 7. Performance (Evaluations)
  for (let i = 0; i < 10; i++) {
    await prisma.evaluation.create({
      data: {
        evaluatee_emp_id: employees[i].id_emp,
        evaluator_id: employees[0].id_emp,
        date_eval: new Date(),
        type_eval: 'Annual',
        score: Math.floor(75 + Math.random() * 20),
        comments: 'Excellent work'
      }
    })
  }

  // 8. Training (Formations & Participations)
  for (let i = 0; i < 3; i++) {
    const formation = await prisma.formation.create({
      data: {
        name: `Training Phase ${i}`,
        description: 'Advanced skills',
        location: 'Main Hall',
        date_deb: new Date(),
        duration_days: 5,
        id_instructor: employees[0].id_emp
      }
    })

    for (let j = 1; j < 6; j++) {
      await prisma.participationFormation.create({
        data: {
          id_formation: formation.id_formation,
          id_emp: employees[j].id_emp
        }
      })
    }
  }

  // 9. Tasks
  for (let i = 0; i < 5; i++) {
    await prisma.task.create({
      data: {
        name: `Mission ${i}`,
        description: 'Execute strategic goals',
        priority: 'High',
        date_deb: new Date(),
        date_fin: new Date(Date.now() + 86400000 * 7),
        status: 'To Do',
        assigned_by: employees[0].id_emp,
        assigned_to: employees[i + 1].id_emp
      }
    })
  }

  // 11. Department Managers
  for (let i = 0; i < allDepts.length; i++) {
    await prisma.department.update({
      where: { id_dept: allDepts[i].id_dept },
      data: { manager_id: employees[i % employees.length].id_emp }
    })
  }

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
