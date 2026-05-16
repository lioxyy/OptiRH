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

router.get('/', asyncHandler(async (req, res) => {
  const payslips = await PayrollService.getPayslips(req.user)
  res.json(success(payslips))
}))

router.post('/generate', authorize('Admin'), validate('body', GeneratePayrollSchema), asyncHandler(async (req, res) => {
  const payslip = await PayrollService.generatePayroll(req.body as GeneratePayrollDTO, req.user.id_emp)
  res.status(201).json(success(payslip))
}))

router.patch('/:id/status', authorize('Admin'), validate('params', PayrollParamsSchema), validate('body', UpdatePayrollStatusSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const payslip = await PayrollService.updatePayrollStatus(id, (req.body as UpdatePayrollStatusDTO).status, req.user.id_emp)
  res.json(success(payslip))
}))

export default router
