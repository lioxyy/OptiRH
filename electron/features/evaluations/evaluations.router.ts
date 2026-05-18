import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
  CreateEvaluationSchema,
  CreateCampaignSchema,
  CreateCriteriaSchema,
  EvaluationParamsSchema,
} from './evaluations.schema'
import type {
  CreateEvaluationDTO,
  CreateCampaignDTO,
  CreateCriteriaDTO,
} from './evaluations.types'
import * as EvaluationService from './evaluations.service'

const router = Router()

router.use(authenticate)

// --- DASHBOARD ---
router.get('/dashboard', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const stats = await EvaluationService.getDashboardStats(req.user)
  res.json(success(stats))
}))

// --- CAMPAIGNS ---
router.get('/campaigns', asyncHandler(async (req, res) => {
  const campaigns = await EvaluationService.getCampaigns()
  res.json(success(campaigns))
}))

router.post('/campaigns', authorize('Admin'), validate('body', CreateCampaignSchema), asyncHandler(async (req, res) => {
  const campaign = await EvaluationService.createCampaign(req.body as CreateCampaignDTO, req.user.id_emp)
  res.status(201).json(success(campaign))
}))

// --- CRITERIA ---
router.get('/criteria', asyncHandler(async (req, res) => {
  const criteria = await EvaluationService.getCriteria()
  res.json(success(criteria))
}))

router.post('/criteria', authorize('Admin'), validate('body', CreateCriteriaSchema), asyncHandler(async (req, res) => {
  const criteria = await EvaluationService.createCriteria(req.body as CreateCriteriaDTO, req.user.id_emp)
  res.status(201).json(success(criteria))
}))

// --- EVALUATIONS ---
router.get('/', asyncHandler(async (req, res) => {
  const evaluations = await EvaluationService.getEvaluations(req.user)
  res.json(success(evaluations))
}))

router.post('/', authorize('Admin', 'Agent'), validate('body', CreateEvaluationSchema), asyncHandler(async (req, res) => {
  const evaluation = await EvaluationService.createEvaluation(req.body as CreateEvaluationDTO, req.user.id_emp)
  res.status(201).json(success(evaluation))
}))

router.delete('/:id', authorize('Admin'), asyncHandler(async (req, res) => {
  const result = await EvaluationService.deleteEvaluation(Number(req.params.id), req.user.id_emp)
  res.json(success(result))
}))

export default router
