import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
  CreateLeaveSchema,
  LeaveActionSchema,
  LeaveParamsSchema,
  LeaveBalanceQuerySchema
} from './leaves.schema'
import type { CreateLeaveDTO, LeaveActionDTO, LeaveBalanceQueryDTO } from './leaves.types'
import * as LeavesService from './leaves.service'

const router = Router()

router.use(authenticate)

router.get('/types', asyncHandler(async (_req, res) => {
  const types = await LeavesService.getLeaveTypes()
  res.json(success(types))
}))

router.get('/balance', validate('query', LeaveBalanceQuerySchema), asyncHandler(async (req, res) => {
  const { year } = req.query as unknown as LeaveBalanceQueryDTO
  const balances = await LeavesService.getLeaveBalance(req.user.id_emp, year)
  res.json(success(balances))
}))

router.get('/', asyncHandler(async (req, res) => {
  const leaves = await LeavesService.getLeaves(req.user)
  res.json(success(leaves))
}))

router.post('/', authorize('Employee'), validate('body', CreateLeaveSchema), asyncHandler(async (req, res) => {
  const leave = await LeavesService.createLeaveRequest(req.body as CreateLeaveDTO, req.user.id_emp)
  res.status(201).json(success(leave))
}))

router.patch('/:id/action', authorize('Admin', 'Agent'), validate('params', LeaveParamsSchema), validate('body', LeaveActionSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const { action } = req.body as LeaveActionDTO
  
  let result
  if (action === 'approve') {
    result = await LeavesService.approveLeave(id, req.user.id_emp)
  } else if (action === 'reject') {
    result = await LeavesService.rejectLeave(id, req.user.id_emp)
  } else if (action === 'cancel') {
    result = await LeavesService.cancelApprovedLeave(id, req.user.id_emp)
  }

  res.json(success(result))
}))

router.delete('/:id', authorize('Admin'), validate('params', LeaveParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  await LeavesService.cancelApprovedLeave(id, req.user.id_emp)
  res.json(success(null, 'Leave cancelled successfully'))
}))

export default router
