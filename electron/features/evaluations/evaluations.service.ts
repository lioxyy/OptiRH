import { prisma } from '../../db/client'

export async function getCampaigns() {
  return await prisma.evaluationCampaign.findMany({
    orderBy: { date_start: 'desc' }
  })
}

export async function createCampaign(data: any) {
  return await prisma.evaluationCampaign.create({
    data: {
      title: data.title,
      type: data.type,
      date_start: new Date(data.date_start),
      date_end: new Date(data.date_end),
      description: data.description,
      status: data.status || 'Active'
    }
  })
}

export async function getCriteria() {
  return await prisma.evaluationCriteria.findMany()
}

export async function createCriteria(data: any) {
  return await prisma.evaluationCriteria.create({
    data: {
      name: data.name,
      description: data.description,
      weight: Number(data.weight),
      max_score: Number(data.max_score)
    }
  })
}

export async function getEmployeeEvaluations(employeeId: number) {
  return await prisma.employeeEvaluation.findMany({
    where: { id_emp: employeeId },
    include: {
      campaign: true,
      evaluator: { select: { name: true, role: true } },
      employee: { select: { name: true, email: true, role: true, date_employment: true, department: { select: { name: true } } } },
      scores: { include: { criteria: true } }
    },
    orderBy: { date_eval: 'desc' }
  })
}

export async function submitEvaluation(data: any, evaluatorId: number) {
  const { id_emp, campaign_id, general_cmt, decision, scores } = data
  
  // Calculate final score
  let finalScore = 0
  for (const s of scores) {
    const criteria = await prisma.evaluationCriteria.findUnique({ where: { id_criteria: Number(s.criteria_id) } })
    if (criteria) {
      finalScore += (Number(s.score) / criteria.max_score) * criteria.weight
    }
  }

  return await prisma.$transaction(async (tx: any) => {
    const evaluation = await tx.employeeEvaluation.create({
      data: {
        id_emp: Number(id_emp),
        evaluator_id: Number(evaluatorId),
        campaign_id: Number(campaign_id),
        general_cmt,
        final_score: finalScore,
        decision,
      }
    })

    const scoresToCreate = scores.map((s: any) => ({
      eval_id: evaluation.id_emp_eval,
      criteria_id: Number(s.criteria_id),
      score: Number(s.score),
      comment: s.comment || ''
    }))

    await tx.evaluationScore.createMany({ data: scoresToCreate })

    return evaluation
  })
}

export async function getDashboardStats() {
  const allEvals = await prisma.employeeEvaluation.findMany({
    include: { 
      employee: { include: { department: true } },
      campaign: true 
    },
    orderBy: { date_eval: 'desc' }
  })

  // Moyenne par département (uniquement la dernière évaluation par employé, campagnes semestrielles uniquement)
  const deptMap: Record<string, { total: number, count: number }> = {}
  const seenEmployees = new Set<number>()

  allEvals.forEach((e: any) => {
    if (e.campaign?.type === 'Semestrielle') {
      if (!seenEmployees.has(e.id_emp)) {
        seenEmployees.add(e.id_emp)
        const dName = e.employee.department?.name || 'Sans département'
        if (!deptMap[dName]) deptMap[dName] = { total: 0, count: 0 }
        deptMap[dName].total += e.final_score
        deptMap[dName].count += 1
      }
    }
  })

  const averagePerDept = Object.entries(deptMap).map(([name, data]) => ({
    name,
    average: parseFloat((data.total / data.count).toFixed(2))
  }))

  // Top performers
  const topPerformers = await prisma.employeeEvaluation.findMany({
    orderBy: { final_score: 'desc' },
    take: 5,
    include: { employee: { select: { name: true } }, campaign: { select: { title: true } } }
  })

  return {
    averagePerDept,
    topPerformers: topPerformers.map((t: any) => ({
      name: t.employee.name,
      score: t.final_score.toFixed(2),
      campaign: t.campaign.title
    })),
    totalEvaluations: allEvals.length
  }
}

export async function getAllEvaluations() {
  return await prisma.employeeEvaluation.findMany({
    include: {
      employee: { select: { name: true, id_dept: true, department: { select: { name: true } } } },
      campaign: { select: { title: true } },
      evaluator: { select: { name: true } }
    },
    orderBy: { date_eval: 'desc' }
  })
}
