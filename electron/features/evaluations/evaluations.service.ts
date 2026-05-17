import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { createNotification } from '../../lib/notifications'
import type { RequestUser } from '../../middleware/authenticate'
import type { CreateEvaluationDTO } from './evaluations.types'

export async function getEvaluations(user: RequestUser) {
  if (user.role === 'Admin') {
    return prisma.evaluation.findMany({
      include: {
        evaluator: { select: { name: true } },
        evaluatee_emp: { select: { name: true } },
        evaluatee_cand: { select: { name: true } },
      },
      orderBy: { date_eval: 'desc' },
    })
  }

  return prisma.evaluation.findMany({
    where: {
      OR: [
        { evaluator_id: user.id_emp },
        { evaluatee_emp: { id_dept: user.id_dept } },
      ],
    },
    include: {
      evaluator: { select: { name: true } },
      evaluatee_emp: { select: { name: true } },
      evaluatee_cand: { select: { name: true } },
    },
    orderBy: { date_eval: 'desc' },
  })
}

export async function createEvaluation(data: CreateEvaluationDTO, evaluatorId: number) {
  if (data.type_eval === 'Employee' && !data.evaluatee_emp_id) {
    throw new AppError('VALIDATION_ERROR', 400, 'evaluatee_emp_id is required for Employee evaluations')
  }
  if (data.type_eval === 'Candidate' && !data.evaluatee_cand_id) {
    throw new AppError('VALIDATION_ERROR', 400, 'evaluatee_cand_id is required for Candidate evaluations')
  }

  return prisma.$transaction(async (tx) => {
    const evaluation = await tx.evaluation.create({
      data: {
        score: data.score,
        bonus_amount: data.bonus_amount,
        comments: data.comments ?? null,
        type_eval: data.type_eval,
        evaluator_id: evaluatorId,
        evaluatee_emp_id: data.evaluatee_emp_id ?? null,
        evaluatee_cand_id: data.evaluatee_cand_id ?? null,
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
        `You have received a new evaluation with a score of ${evaluation.score}/100`,
        'Evaluation',
        evaluation.id_eval
      )
    }

    return evaluation
  })
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
