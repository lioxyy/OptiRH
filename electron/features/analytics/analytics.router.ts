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

router.get('/payroll-trend', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getPayrollTrend()
  res.json(success(data))
}))

router.get('/score-distribution', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getScoreDistribution()
  res.json(success(data))
}))

router.get('/headcount-trend', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getHeadcountTrend()
  res.json(success(data))
}))

router.get('/department-stats', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getDepartmentStats()
  res.json(success(data))
}))

router.get('/demographics', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getDemographics()
  res.json(success(data))
}))

router.get('/tenure-stats', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getTenureStats()
  res.json(success(data))
}))

router.get('/supervision-stats', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getSupervisionStats()
  res.json(success(data))
}))

router.get('/absence-deep-dive', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getAbsenceDeepDive()
  res.json(success(data))
}))

router.get('/leave-utilization', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getLeaveUtilization()
  res.json(success(data))
}))

router.get('/payroll-deep-dive', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getPayrollDeepDive()
  res.json(success(data))
}))

router.get('/department-payroll', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getDepartmentPayroll()
  res.json(success(data))
}))

router.get('/role-payroll', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getRolePayrollStats()
  res.json(success(data))
}))

router.get('/recruitment-velocity', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getRecruitmentVelocity()
  res.json(success(data))
}))

router.get('/performance-trends', asyncHandler(async (_req, res) => {
  const data = await AnalyticsService.getPerformanceTrends()
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
