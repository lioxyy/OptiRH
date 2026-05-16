import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'
import { writeAuditLog } from '../../lib/audit'
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

  return prisma.candidat.findMany({
    where: { agent_in_charge: user.id_emp },
    include: {
      agent: { select: { name: true } },
      entretiens: { include: { agent: { select: { name: true } } } },
    },
    orderBy: { date_candidature: 'desc' },
  })
}

export async function createCandidate(data: CreateCandidateDTO) {
  return prisma.candidat.create({
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

export async function scheduleInterview(data: ScheduleInterviewDTO) {
  return prisma.entretien.create({
    data: {
      id_cand: data.id_cand,
      date_heure: new Date(data.date_heure),
      id_agent: data.id_agent,
      status: 'Scheduled',
    },
    include: { candidat: { select: { name: true } }, agent: { select: { name: true } } },
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

    await tx.evaluation.create({
      data: {
        score: data.score,
        comments: data.notes ?? null,
        type_eval: 'Candidate',
        evaluator_id: agentId,
        evaluatee_cand_id: interview.id_cand,
      },
    })

    return updated
  })
}
