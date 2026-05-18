import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  EmployeeParamsSchema,
} from './employees.schema'
import type { CreateEmployeeDTO, UpdateEmployeeDTO } from './employees.types'
import * as EmployeeService from './employees.service'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(async (req, res) => {
  const employees = await EmployeeService.getEmployees(req.user)
  res.json(success(employees))
}))

router.get('/me', asyncHandler(async (req, res) => {
  const employee = await EmployeeService.getMe(req.user.id_emp)
  res.json(success(employee))
}))
router.get('/org-chart', authorize('Admin'), asyncHandler(async (_req, res) => {
  const chart = await EmployeeService.getOrgChart()
  res.json(success(chart))
}))

router.get('/:id', validate('params', EmployeeParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    const employee = await EmployeeService.getEmployeeById(id, req.user)
    res.json(success(employee))
  }),
)

router.post('/', authorize('Admin'), validate('body', CreateEmployeeSchema),
  asyncHandler(async (req, res) => {
    const employee = await EmployeeService.createEmployee(req.body as CreateEmployeeDTO, req.user.id_emp)
    res.status(201).json(success(employee))
  }),
)

router.patch('/:id', authorize('Admin'), validate('params', EmployeeParamsSchema), validate('body', UpdateEmployeeSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    const employee = await EmployeeService.updateEmployee(id, req.body as UpdateEmployeeDTO, req.user)
    res.json(success(employee))
  }),
)

router.delete('/:id', authorize('Admin'), validate('params', EmployeeParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    await EmployeeService.deleteEmployee(id, req.user.id_emp)
    res.json(success(null, 'Employee deleted'))
  }),
)

export default router
