import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import * as EvaluationService from './evaluations.service'

const router = Router()

router.use(authenticate)

// --- CAMPAIGNS ---
router.get('/campaigns', asyncHandler(async (req, res) => {
  const campaigns = await EvaluationService.getCampaigns()
  res.json(success(campaigns))
}))

router.post('/campaigns', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const campaign = await EvaluationService.createCampaign(req.body)
  res.status(201).json(success(campaign))
}))

// --- CRITERIA ---
router.get('/criteria', asyncHandler(async (req, res) => {
  const criteria = await EvaluationService.getCriteria()
  res.json(success(criteria))
}))

router.post('/criteria', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const criterion = await EvaluationService.createCriteria(req.body)
  res.status(201).json(success(criterion))
}))

// --- EVALUATIONS ---
router.get('/history', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const evals = await EvaluationService.getAllEvaluations()
  res.json(success(evals))
}))

router.get('/employee/:id', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const evals = await EvaluationService.getEmployeeEvaluations(Number(id))
  res.json(success(evals))
}))

router.get('/my-evaluations', asyncHandler(async (req, res) => {
  const evals = await EvaluationService.getEmployeeEvaluations(req.user.id_emp)
  res.json(success(evals))
}))

router.post('/submit', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const data = req.body
  const result = await EvaluationService.submitEvaluation(data, req.user.id_emp)
  res.status(201).json(success(result))
}))

router.get('/dashboard', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const stats = await EvaluationService.getDashboardStats()
  res.json(success(stats))
}))

export default router
