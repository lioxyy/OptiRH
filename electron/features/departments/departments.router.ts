import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  DepartmentParamsSchema,
} from './departments.schema'
import type { CreateDepartmentDTO, UpdateDepartmentDTO } from './departments.types'
import * as DepartmentService from './departments.service'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(async (req, res) => {
  const departments = await DepartmentService.getDepartments(req.user)
  res.json(success(departments))
}))

router.get('/:id', validate('params', DepartmentParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const department = await DepartmentService.getDepartmentById(id, req.user)
  res.json(success(department))
}))

router.post('/', authorize('Admin'), validate('body', CreateDepartmentSchema), asyncHandler(async (req, res) => {
  const department = await DepartmentService.createDepartment(req.body as CreateDepartmentDTO, req.user.id_emp)
  res.status(201).json(success(department))
}))

router.patch('/:id', authorize('Admin'), validate('params', DepartmentParamsSchema), validate('body', UpdateDepartmentSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const department = await DepartmentService.updateDepartment(id, req.body as UpdateDepartmentDTO, req.user.id_emp)
  res.json(success(department))
}))

router.delete('/:id', authorize('Admin'), validate('params', DepartmentParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  await DepartmentService.deleteDepartment(id, req.user.id_emp)
  res.json(success(null, 'Department deleted successfully'))
}))

export default router
