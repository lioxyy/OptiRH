import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
  CreateEvaluationSchema,
  EmployeeParamsSchema,
} from './evaluations.schema'
import type { CreateEvaluationDTO } from './evaluations.types'
import * as EvaluationService from './evaluations.service'

const router = Router()

router.use(authenticate)
router.use(authorize('Admin', 'Agent'))

router.get('/', asyncHandler(async (req, res) => {
  const evaluations = await EvaluationService.getEvaluations(req.user)
  res.json(success(evaluations))
}))

router.post('/', validate('body', CreateEvaluationSchema), asyncHandler(async (req, res) => {
  const evaluation = await EvaluationService.createEvaluation(req.body as CreateEvaluationDTO, req.user.id_emp)
  res.status(201).json(success(evaluation))
}))

router.get('/employee/:id/latest-bonus', authorize('Admin'), validate('params', EmployeeParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const bonus = await EvaluationService.getLatestBonus(id)
  res.json(success(bonus))
}))

export default router
