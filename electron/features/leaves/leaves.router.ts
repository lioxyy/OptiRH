import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { LeaveTypeSchema, LeaveRequestSchema, UpdateLeaveStatusSchema } from './leaves.schema'
import * as LeaveService from './leaves.service'

const router = Router()

// Leave Types
router.get('/types', authenticate, asyncHandler(async (req, res) => {
  const types = await LeaveService.getLeaveTypes()
  res.json(success(types))
}))

router.post('/types', authenticate, authorize('Admin'), validate('body', LeaveTypeSchema), asyncHandler(async (req, res) => {
  const type = await LeaveService.createLeaveType(req.body)
  res.json(success(type))
}))

router.put('/types/:id', authenticate, authorize('Admin'), validate('body', LeaveTypeSchema), asyncHandler(async (req, res) => {
  const type = await LeaveService.updateLeaveType(Number(req.params.id), req.body)
  res.json(success(type))
}))

// Leave Requests
router.get('/requests', authenticate, asyncHandler(async (req, res) => {
  const filters: any = {}
  if (req.user.role === 'Employee') {
    filters.id_emp = req.user.id_emp
  }
  const requests = await LeaveService.getLeaveRequests(filters)
  res.json(success(requests))
}))

router.post('/requests', authenticate, validate('body', LeaveRequestSchema), asyncHandler(async (req, res) => {
  const request = await LeaveService.createLeaveRequest(req.user.id_emp, req.body)
  res.json(success(request))
}))

router.patch('/requests/:id/status', authenticate, authorize('Admin', 'Agent'), validate('body', UpdateLeaveStatusSchema), asyncHandler(async (req, res) => {
  const result = await LeaveService.updateLeaveStatus(Number(req.params.id), req.body.status, req.user.id_emp)
  res.json(success(result))
}))

// Balances
router.get('/balances/:year', authenticate, asyncHandler(async (req, res) => {
  const balances = await LeaveService.getEmployeeBalances(req.user.id_emp, Number(req.params.year))
  res.json(success(balances))
}))

export default router
