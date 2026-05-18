import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { createNotification } from '../../lib/notifications'
import { writeAuditLog } from '../../lib/audit'
import type { RequestUser } from '../../middleware/authenticate'
import type {
  CreateEvaluationDTO,
  CreateCampaignDTO,
  CreateCriteriaDTO
} from './evaluations.types'

// --- CAMPAIGNS ---

export async function getCampaigns() {
  return prisma.evaluationCampaign.findMany({
    orderBy: { date_start: 'desc' }
  })
}

export async function createCampaign(data: CreateCampaignDTO, actorId: number) {
  const campaign = await prisma.evaluationCampaign.create({
    data: {
      title: data.title,
      type: data.type,
      date_start: new Date(data.date_start),
      date_end: new Date(data.date_end),
      description: data.description ?? null,
    }
  })
  await writeAuditLog(prisma, actorId, 'CREATE', 'EvaluationCampaign', campaign.id_campaign, campaign)
  return campaign
}

// --- CRITERIA ---

export async function getCriteria() {
  return prisma.evaluationCriteria.findMany({
    orderBy: { weight: 'desc' }
  })
}

export async function createCriteria(data: CreateCriteriaDTO, actorId: number) {
  const criteria = await prisma.evaluationCriteria.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      weight: data.weight,
      max_score: data.max_score,
    }
  })
  await writeAuditLog(prisma, actorId, 'CREATE', 'EvaluationCriteria', criteria.id_criteria, criteria)
  return criteria
}

// --- EVALUATIONS ---

export async function getEvaluations(user: RequestUser) {
  const include = {
    evaluator: { select: { name: true } },
    evaluatee_emp: { select: { name: true } },
    evaluatee_cand: { select: { name: true } },
    campaign: { select: { title: true } },
    scores: { include: { criteria: true } },
  }

  if (user.role === 'Admin') {
    return prisma.evaluation.findMany({
      include,
      orderBy: { date_eval: 'desc' },
    })
  }

  const managedDepts = await prisma.department.findMany({
    where: { manager_id: user.id_emp },
    select: { id_dept: true }
  })
  const managedDeptIds = managedDepts.map(d => d.id_dept)

  return prisma.evaluation.findMany({
    where: {
      OR: [
        { evaluator_id: user.id_emp },
        { evaluatee_emp: { departments: { some: { id_dept: { in: managedDeptIds } } } } },
      ],
    },
    include,
    orderBy: { date_eval: 'desc' },
  })
}

export async function createEvaluation(data: CreateEvaluationDTO, evaluatorId: number) {
  return prisma.$transaction(async (tx) => {
    return createEvaluationInternal(tx, data, evaluatorId)
  })
}

export async function createEvaluationInternal(tx: any, data: CreateEvaluationDTO, evaluatorId: number) {
  // Validation
  if (data.type_eval === 'Employee' && !data.evaluatee_emp_id) {
    throw new AppError('VALIDATION_ERROR', 400, 'evaluatee_emp_id is required for Employee evaluations')
  }
  if (data.type_eval === 'Candidate' && !data.evaluatee_cand_id) {
    throw new AppError('VALIDATION_ERROR', 400, 'evaluatee_cand_id is required for Candidate evaluations')
  }

  // Calculate final score based on criteria weights
  let totalWeightedScore = 0
  let totalWeight = 0

  // Fetch criteria objects to verify existence and get weights
  const criteriaIds = data.scores.map(s => s.criteria_id)
  const criteriaList = await tx.evaluationCriteria.findMany({
    where: { id_criteria: { in: criteriaIds } }
  })

  if (criteriaList.length !== criteriaIds.length) {
    throw new AppError('NOT_FOUND', 404, 'One or more evaluation criteria not found')
  }

  for (const scoreInput of data.scores) {
    const criteria = criteriaList.find((c: any) => c.id_criteria === scoreInput.criteria_id)!
    // Normalized score (out of 100) * weight
    const normalizedScore = (scoreInput.score / criteria.max_score) * 100
    totalWeightedScore += normalizedScore * criteria.weight
    totalWeight += criteria.weight
  }

  const finalScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0

  const evaluation = await tx.evaluation.create({
    data: {
      score: finalScore,
      bonus_amount: data.bonus_amount ?? 0,
      comments: data.comments ?? null,
      type_eval: data.type_eval,
      campaign_id: data.campaign_id ?? null,
      evaluator_id: evaluatorId,
      evaluatee_emp_id: data.evaluatee_emp_id ?? null,
      evaluatee_cand_id: data.evaluatee_cand_id ?? null,
      scores: {
        create: data.scores.map(s => ({
          criteria_id: s.criteria_id,
          score: s.score,
          comment: s.comment ?? null,
        }))
      }
    },
    include: {
      evaluatee_emp: { select: { name: true } },
      evaluatee_cand: { select: { name: true } },
    },
  })

  if (evaluation.type_eval === 'Employee' && evaluation.evaluatee_emp_id) {
    await createNotification(
      tx,
      evaluation.evaluatee_emp_id,
      'EVALUATION_RECEIVED',
      `You have received a new evaluation with a final score of ${evaluation.score}/100`,
      'Evaluation',
      evaluation.id_eval
    )
  }

  await writeAuditLog(tx, evaluatorId, 'CREATE', 'Evaluation', evaluation.id_eval, evaluation)
  return evaluation
}

export async function getDashboardStats() {
  const evaluations = await prisma.evaluation.findMany({
    where: { type_eval: 'Employee' },
    include: {
      evaluatee_emp: { include: { departments: true } },
      campaign: true,
    }
  })

  // Group by department for average
  const deptStats: Record<string, { total: number, count: number }> = {}
  evaluations.forEach((ev: any) => {
    if (ev.evaluatee_emp) {
      const depts = ev.evaluatee_emp.departments
      depts.forEach((d: any) => {
        if (!deptStats[d.name]) deptStats[d.name] = { total: 0, count: 0 }
        deptStats[d.name].total += ev.score
        deptStats[d.name].count += 1
      })
    }
  })

  const averageByDept = Object.entries(deptStats).map(([name, stats]) => ({
    name,
    average: Math.round(stats.total / stats.count)
  }))

  const topPerformers = await prisma.evaluation.findMany({
    where: { type_eval: 'Employee' },
    include: { evaluatee_emp: { select: { name: true } } },
    orderBy: { score: 'desc' },
    take: 5
  })

  return {
    totalEvaluations: evaluations.length,
    averageByDept,
    topPerformers: topPerformers.map(tp => ({
      name: tp.evaluatee_emp?.name || 'Unknown',
      score: tp.score
    }))
  }
}

export async function getLatestBonus(employeeId: number) {
  const evaluation = await prisma.evaluation.findFirst({
    where: {
      evaluatee_emp_id: employeeId,
      bonus_amount: { gt: 0 },
    },
    orderBy: { date_eval: 'desc' },
  })

  return { bonus_amount: evaluation?.bonus_amount ?? 0 }
}
