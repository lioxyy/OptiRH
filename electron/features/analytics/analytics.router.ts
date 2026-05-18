import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import * as AnalyticsService from './analytics.service'

const router = Router()

router.use(authenticate)
router.use(authorize('Admin'))

router.get('/summary', asyncHandler(async (_req, res) => {
  const summary = await AnalyticsService.getSummary()
  res.json(success(summary))
}))

router.get('/diversity', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getDiversity()
  res.json(success(data))
}))

router.get('/absentee-rates', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getAbsenteeRates()
  res.json(success(data))
}))

router.get('/recruitment', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getRecruitmentStats()
  res.json(success(data))
}))

router.get('/top-performers', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getTopPerformers()
  res.json(success(data))
}))

router.get('/dashboard/admin', authorize('Admin'), asyncHandler(async (req, res) => {
  const data = await AnalyticsService.getAdminDashboard(req.user.id_emp)
  res.json(success(data))
}))

router.get('/dashboard/agent', authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const data = await AnalyticsService.getAgentDashboard(req.user.id_emp)
  res.json(success(data))
}))

router.get('/dashboard/employee', asyncHandler(async (req, res) => {
  const data = await AnalyticsService.getEmployeeDashboard(req.user.id_emp)
  res.json(success(data))
}))

export default router
