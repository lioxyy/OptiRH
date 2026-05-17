import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { GeneratePayrollSchema, ValidatePayrollSchema } from './payroll.schema'
import * as PayrollService from './payroll.service'

const router = Router()

// Fetch all generated payroll records (restricted to Admin and Agent)
router.get('/history', authenticate, authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const filters: any = {}
  if (req.query.id_emp) filters.id_emp = Number(req.query.id_emp)
  if (req.query.month_year) filters.month_year = String(req.query.month_year)

  const history = await PayrollService.getPayrollHistory(filters)
  res.json(success(history))
}))

// Fetch currently logged-in employee's payroll slips
router.get('/my-history', authenticate, asyncHandler(async (req, res) => {
  const history = await PayrollService.getPayrollHistory({ id_emp: req.user.id_emp })
  res.json(success(history))
}))

// Generate/Compute monthly payroll slip (Admin or Agent)
router.post('/generate', authenticate, authorize('Admin', 'Agent'), validate('body', GeneratePayrollSchema), asyncHandler(async (req, res) => {
  const { id_emp, month_year } = req.body
  const record = await PayrollService.generateMonthlyPayroll(id_emp, month_year)
  res.json(success(record))
}))

// Validate or pay a payroll slip (Admin or Agent)
router.post('/:id/validate', authenticate, authorize('Admin', 'Agent'), validate('body', ValidatePayrollSchema), asyncHandler(async (req, res) => {
  const result = await PayrollService.validatePayroll(
    Number(req.params.id),
    req.body.status,
    req.user.id_emp
  )
  res.json(success(result))
}))

export default router
