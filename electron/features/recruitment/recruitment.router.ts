import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
  CreateCandidateSchema,
  UpdateCandidateStatusSchema,
  ScheduleInterviewSchema,
  SubmitInterviewResultSchema,
  CandidateParamsSchema,
  InterviewParamsSchema,
} from './recruitment.schema'
import type {
  CreateCandidateDTO,
  UpdateCandidateStatusDTO,
  ScheduleInterviewDTO,
  SubmitInterviewResultDTO,
} from './recruitment.types'
import * as RecruitmentService from './recruitment.service'

const router = Router()

router.use(authenticate)
router.use(authorize('Admin', 'Agent'))

router.get('/', asyncHandler(async (req, res) => {
  const candidates = await RecruitmentService.getCandidates(req.user)
  res.json(success(candidates))
}))

router.post('/', validate('body', CreateCandidateSchema), asyncHandler(async (req, res) => {
  const candidate = await RecruitmentService.createCandidate(req.body as CreateCandidateDTO, req.user.id_emp)
  res.status(201).json(success(candidate))
}))

router.patch('/:id/status', validate('params', CandidateParamsSchema), validate('body', UpdateCandidateStatusSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const candidate = await RecruitmentService.updateCandidateStatus(id, req.body as UpdateCandidateStatusDTO, req.user.id_emp)
  res.json(success(candidate))
}))

router.post('/interviews', validate('body', ScheduleInterviewSchema), asyncHandler(async (req, res) => {
  const interview = await RecruitmentService.scheduleInterview(req.body as ScheduleInterviewDTO, req.user.id_emp)
  res.status(201).json(success(interview))
}))

router.patch('/interviews/:id/result', validate('params', InterviewParamsSchema), validate('body', SubmitInterviewResultSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const result = await RecruitmentService.submitInterviewResult(id, req.body as SubmitInterviewResultDTO, req.user.id_emp)
  res.json(success(result))
}))

export default router
