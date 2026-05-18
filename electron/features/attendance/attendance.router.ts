import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { ClockInOutSchema, ManualOverrideSchema } from './attendance.schema'
import * as AttendanceService from './attendance.service'

const router = Router()

// Fetch daily roster (restricted to Admin and Agent)
router.get('/roster', authenticate, authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const deptId = req.query.id_dept ? Number(req.query.id_dept) : undefined
  const roster = await AttendanceService.getDailyRoster(deptId)
  res.json(success(roster))
}))

// Fetch currently logged-in employee's points history
router.get('/my-history', authenticate, asyncHandler(async (req, res) => {
  const filters: any = {}
  if (req.query.startDate) filters.startDate = new Date(String(req.query.startDate))
  if (req.query.endDate) filters.endDate = new Date(String(req.query.endDate))

  const history = await AttendanceService.getPersonalHistory(req.user.id_emp, filters)
  res.json(success(history))
}))

// Clock in (Employee)
router.post('/clock-in', authenticate, validate('body', ClockInOutSchema), asyncHandler(async (req, res) => {
  const record = await AttendanceService.clockIn(req.user.id_emp, req.body.notes || undefined)
  res.json(success(record))
}))

// Clock out (Employee)
router.post('/clock-out', authenticate, validate('body', ClockInOutSchema), asyncHandler(async (req, res) => {
  const record = await AttendanceService.clockOut(req.user.id_emp, req.body.notes || undefined)
  res.json(success(record))
}))

// Manual override (Admin or Agent)
router.post('/override', authenticate, authorize('Admin', 'Agent'), validate('body', ManualOverrideSchema), asyncHandler(async (req, res) => {
  const record = await AttendanceService.manualOverride(req.body, req.user.id_emp)
  res.json(success(record))
}))

export default router
