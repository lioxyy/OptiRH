import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { SubmitMassroufSchema, ReviewMassroufSchema } from './massrouf.schema'
import * as MassroufService from './massrouf.service'

const router = Router()

// Fetch all advance requests (restricted to Admin and Agent)
router.get('/', authenticate, authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const filters: any = {}
  if (req.query.id_emp) filters.id_emp = Number(req.query.id_emp)
  if (req.query.status) filters.status = String(req.query.status)

  const history = await MassroufService.getMassroufHistory(filters)
  res.json(success(history))
}))

// Fetch currently logged-in employee's advance requests
router.get('/my-requests', authenticate, asyncHandler(async (req, res) => {
  const history = await MassroufService.getMassroufHistory({ id_emp: req.user.id_emp })
  res.json(success(history))
}))

// Request a new salary advance (Employees)
router.post('/request', authenticate, validate('body', SubmitMassroufSchema), asyncHandler(async (req, res) => {
  const request = await MassroufService.requestMassrouf(req.user.id_emp, req.body.amount)
  res.json(success(request))
}))

// Review a salary advance (Admin or Agent)
router.post('/:id/review', authenticate, authorize('Admin', 'Agent'), validate('body', ReviewMassroufSchema), asyncHandler(async (req, res) => {
  const updated = await MassroufService.validateMassrouf(
    Number(req.params.id),
    req.body.status,
    req.user.id_emp
  )
  res.json(success(updated))
}))

export default router
