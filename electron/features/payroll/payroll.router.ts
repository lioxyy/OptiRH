import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
  GeneratePayrollSchema,
  PayrollParamsSchema,
  UpdatePayrollStatusSchema,
} from './payroll.schema'
import type { GeneratePayrollDTO, UpdatePayrollStatusDTO } from './payroll.types'
import * as PayrollService from './payroll.service'

const router = Router()

router.use(authenticate)

// GET /api/payroll/history - Fetch salary history records
router.get('/history', asyncHandler(async (req, res) => {
  const filters: any = {}
  
  if (req.user.role !== 'Admin' && req.user.role !== 'Agent') {
    // Security Guard: Regular employees are strictly restricted to their own payroll sheets
    filters.id_emp = req.user.id_emp
  } else if (req.query.id_emp) {
    // Admins/Agents can view other employees' records
    filters.id_emp = Number(req.query.id_emp)
  }
  
  if (req.query.month_year) {
    filters.month_year = String(req.query.month_year)
  }
  
  const payslips = await PayrollService.getPayrollHistory(filters)
  res.json(success(payslips))
}))

// GET /api/payroll/ - Personal payslips list (fallback)
router.get('/', asyncHandler(async (req, res) => {
  const payslips = await PayrollService.getPayslips(req.user)
  res.json(success(payslips))
}))

// POST /api/payroll/generate - Admin only payroll calculations
router.post('/generate', authorize('Admin'), validate('body', GeneratePayrollSchema), asyncHandler(async (req, res) => {
  const payslip = await PayrollService.generatePayroll(req.body as GeneratePayrollDTO, req.user.id_emp)
  res.status(201).json(success(payslip))
}))

// POST /api/payroll/:id/validate - Admin only status updates (Validate/Mark Paid)
router.post('/:id/validate', authorize('Admin'), validate('params', PayrollParamsSchema), validate('body', UpdatePayrollStatusSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const payslip = await PayrollService.updatePayrollStatus(id, (req.body as UpdatePayrollStatusDTO).status, req.user.id_emp)
  res.json(success(payslip))
}))

// PATCH /api/payroll/:id/status - Maintain backward compatibility if needed
router.patch('/:id/status', authorize('Admin'), validate('params', PayrollParamsSchema), validate('body', UpdatePayrollStatusSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const payslip = await PayrollService.updatePayrollStatus(id, (req.body as UpdatePayrollStatusDTO).status, req.user.id_emp)
  res.json(success(payslip))
}))

export default router
