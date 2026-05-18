import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existingTypes = await prisma.leaveType.findMany()
  if (existingTypes.length === 0) {
    await prisma.leaveType.createMany({
      data: [
        { name: 'Annual Leave', default_days: 30 },
        { name: 'Sick Leave', default_days: 15 },
        { name: 'Maternity Leave', default_days: 90 },
        { name: 'Unpaid Leave', default_days: 0 },
      ],
    })
  }

  const dept = await prisma.department.upsert({
    where: { id_dept: 1 },
    update: {},
    create: { name: 'General', description: 'Default department' },
  })

  const hash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@optirh.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@optirh.com',
      password_hash: hash,
      role: 'Admin',
      date_birth: new Date('1990-01-01'),
      date_employment: new Date(),
      id_dept: dept.id_dept,
    },
  })

  // --- MOCK DATA POUR ÉVALUATIONS ---
  const empTest = await prisma.employee.upsert({
    where: { email: 'employe.test@optirh.com' },
    update: {},
    create: {
      name: 'Jean Dupont',
      email: 'employe.test@optirh.com',
      password_hash: hash,
      role: 'Employee',
      date_birth: new Date('1995-05-15'),
      date_employment: new Date('2023-01-10'),
      id_dept: dept.id_dept,
    },
  })

  const existingCampaigns = await prisma.evaluationCampaign.findMany()
  if (existingCampaigns.length === 0) {
    const campaign = await prisma.evaluationCampaign.create({
      data: {
        title: 'Évaluation Semestrielle S1 2026',
        type: 'Semestrielle',
        date_start: new Date('2026-06-01'),
        date_end: new Date('2026-06-30'),
        description: 'Évaluation des performances du premier semestre 2026.',
        status: 'Active',
      }
    })

    const critProd = await prisma.evaluationCriteria.create({
      data: { name: 'Productivité', description: 'Atteinte des objectifs', weight: 50, max_score: 20 }
    })
    const critCom = await prisma.evaluationCriteria.create({
      data: { name: 'Communication', description: 'Travail en équipe', weight: 30, max_score: 20 }
    })
    const critPonct = await prisma.evaluationCriteria.create({
      data: { name: 'Ponctualité', description: 'Respect des horaires', weight: 20, max_score: 20 }
    })

    // Création de l'évaluation test
    const finalScore = (16 / 20) * 50 + (14 / 20) * 30 + (18 / 20) * 20 // 40 + 21 + 18 = 79% (noté sur 100 ici vu les poids, l'algo donne ça)
    
    const evaluation = await prisma.employeeEvaluation.create({
      data: {
        id_emp: empTest.id_emp,
        evaluator_id: admin.id_emp,
        campaign_id: campaign.id_campaign,
        general_cmt: 'Jean a fourni un excellent travail ce semestre, particulièrement sur la productivité. La communication peut encore être améliorée.',
        final_score: finalScore,
        decision: 'Bon',
      }
    })

    await prisma.evaluationScore.createMany({
      data: [
        { eval_id: evaluation.id_emp_eval, criteria_id: critProd.id_criteria, score: 16, comment: 'Très bonne productivité globale.' },
        { eval_id: evaluation.id_emp_eval, criteria_id: critCom.id_criteria, score: 14, comment: 'Pensez à partager plus vos avancées.' },
        { eval_id: evaluation.id_emp_eval, criteria_id: critPonct.id_criteria, score: 18, comment: 'Toujours à l\'heure.' },
      ]
    })
    console.log('Données de test pour les évaluations ajoutées avec succès.')
  }

  console.log('Seed complete. Admin: admin@optirh.com / admin123 | Employé Test: employe.test@optirh.com / admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
