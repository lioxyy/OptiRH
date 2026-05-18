import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
import { createNotification } from '../../lib/notifications'
import * as EvaluationService from '../evaluations/evaluations.service'
import type { RequestUser } from '../../middleware/authenticate'
import type {
  CreateCandidateDTO,
  UpdateCandidateStatusDTO,
  ScheduleInterviewDTO,
  SubmitInterviewResultDTO,
} from './recruitment.types'

export async function getCandidates(user: RequestUser) {
  if (user.role === 'Admin') {
    return prisma.candidat.findMany({
      include: {
        agent: { select: { name: true } },
        entretiens: { include: { agent: { select: { name: true } } } },
      },
      orderBy: { date_candidature: 'desc' },
    })
  }

  if (user.role === 'Agent') {
    const managedDepts = await prisma.department.findMany({
      where: { manager_id: user.id_emp },
      select: { id_dept: true }
    })
    const managedDeptIds = managedDepts.map(d => d.id_dept)

    return prisma.candidat.findMany({
      where: {
        OR: [
          { agent_in_charge: user.id_emp },
          { id_dept: { in: managedDeptIds } },
        ],
      },
      include: {
        agent: { select: { name: true } },
        entretiens: { include: { agent: { select: { name: true } } } },
      },
      orderBy: { date_candidature: 'desc' },
    })
  }

  return prisma.candidat.findMany({
    where: { agent_in_charge: user.id_emp },
    include: {
      agent: { select: { name: true } },
      entretiens: { include: { agent: { select: { name: true } } } },
    },
    orderBy: { date_candidature: 'desc' },
  })
}

export async function createCandidate(data: CreateCandidateDTO, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.candidat.create({
      data: {
        name: data.name,
        email: data.email,
        date_birth: data.date_birth ? new Date(data.date_birth) : null,
        address: data.address ?? null,
        post_applied: data.post_applied ?? null,
        id_dept: data.id_dept ?? null,
        agent_in_charge: data.agent_in_charge ?? null,
        status: 'Pending',
      },
      include: { agent: { select: { name: true } } },
    })

    if (data.agent_in_charge) {
      await createNotification(
        tx,
        data.agent_in_charge,
        'CANDIDATE_ASSIGNED',
        `A new candidate "${candidate.name}" has been assigned to you.`,
        'Recruitment',
        candidate.id_cand
      )
    }

    await writeAuditLog(tx, actorId, 'CREATE', 'Candidat', candidate.id_cand, candidate)
    return candidate
  })
}

export async function updateCandidateStatus(id: number, data: UpdateCandidateStatusDTO, actorId: number) {
  const candidate = await prisma.candidat.findUnique({ where: { id_cand: id } })
  if (!candidate) throw new AppError('CANDIDATE_NOT_FOUND', 404)

  if ((data.status === 'Accepted' || data.status === 'Rejected') && actorId) {
    const actor = await prisma.employee.findUnique({ where: { id_emp: actorId } })
    if (actor?.role !== 'Admin') {
      throw new AppError('FORBIDDEN', 403, 'Only Admin can Accept or Reject candidates')
    }
  }

  const updated = await prisma.candidat.update({
    where: { id_cand: id },
    data: { status: data.status },
    include: { agent: { select: { name: true } } },
  })

  await writeAuditLog(prisma, actorId, 'UPDATE', 'Candidat', id, { ...updated, action: `Status changed to ${data.status}` })
  return updated
}

export async function scheduleInterview(data: ScheduleInterviewDTO, actorId: number) {
  return prisma.$transaction(async (tx) => {
    const interview = await tx.entretien.create({
      data: {
        id_cand: data.id_cand,
        date_heure: new Date(data.date_heure),
        id_agent: data.id_agent,
        status: 'Scheduled',
      },
      include: { candidat: { select: { name: true } }, agent: { select: { name: true } } },
    })

    await tx.candidat.update({
      where: { id_cand: data.id_cand },
      data: { status: 'In Progress' },
    })

    await createNotification(
      tx,
      data.id_agent,
      'INTERVIEW_SCHEDULED',
      `You have an interview scheduled with "${interview.candidat.name}" on ${interview.date_heure.toLocaleString()}.`,
      'Recruitment',
      data.id_cand
    )

    await writeAuditLog(tx, actorId, 'CREATE', 'Entretien', interview.id_entretien, interview)
    return interview
  })
}

export async function submitInterviewResult(id: number, data: SubmitInterviewResultDTO, agentId: number) {
  return prisma.$transaction(async (tx) => {
    const interview = await tx.entretien.findUnique({ where: { id_entretien: id } })
    if (!interview) throw new AppError('NOT_FOUND', 404, 'Interview not found')

    const updated = await tx.entretien.update({
      where: { id_entretien: id },
      data: {
        status: 'Completed',
        result_notes: data.notes ?? null,
      },
    })

    // Use unified evaluation service for consistency
    // Note: In a real scenario, we would select a specific recruitment campaign/criteria here.
    // For now, we'll use a single "General" score entry.

    // Check for a default criteria
    let criteria = await tx.evaluationCriteria.findFirst({ where: { name: 'Interview General' } })
    if (!criteria) {
      criteria = await tx.evaluationCriteria.create({
        data: { name: 'Interview General', weight: 1, max_score: 100 }
      })
    }

    await EvaluationService.createEvaluationInternal(tx as any, {
      type_eval: 'Candidate',
      evaluatee_cand_id: interview.id_cand,
      comments: data.notes ?? undefined,
      scores: [{
        criteria_id: criteria.id_criteria,
        score: data.score,
        comment: 'Standard Interview Score'
      }]
    }, agentId)

    await writeAuditLog(tx, agentId, 'UPDATE', 'Entretien', id, { ...updated, action: 'Interview result submitted' })
    return updated
  })
}
