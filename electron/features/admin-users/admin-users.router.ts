import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../lib/validate'
import { success } from '../../lib/response'
import {
  AdminUserParamsSchema,
  CreateAdminUserSchema,
  UpdateAdminUserPasswordSchema,
  UpdateAdminUserRoleSchema,
  UpdateAdminUserSchema,
} from './admin-users.schema'
import * as AdminUsersService from './admin-users.service'

const router = Router()

router.use(authenticate, authorize('Admin'))

router.get('/', asyncHandler(async (_req, res) => {
  const users = await AdminUsersService.listAdminUsers()
  res.json(success(users))
}))

router.get('/permissions', asyncHandler(async (_req, res) => {
  const permissions = await AdminUsersService.getPermissionsMatrix()
  res.json(success(permissions))
}))

router.get('/:id', validate('params', AdminUserParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const user = await AdminUsersService.getAdminUserById(id)
  res.json(success(user))
}))

router.post('/', validate('body', CreateAdminUserSchema), asyncHandler(async (req, res) => {
  const created = await AdminUsersService.createAdminUser(req.body, req.user.id_emp)
  res.status(201).json(success(created))
}))

router.patch('/:id', validate('params', AdminUserParamsSchema), validate('body', UpdateAdminUserSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const updated = await AdminUsersService.updateAdminUser(id, req.body, req.user)
  res.json(success(updated))
}))

router.patch('/:id/role', validate('params', AdminUserParamsSchema), validate('body', UpdateAdminUserRoleSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const { role } = req.body as { role: 'Admin' | 'Agent' | 'Employee' }
  const updated = await AdminUsersService.updateAdminUserRole(id, role, req.user)
  res.json(success(updated))
}))

router.patch('/:id/password', validate('params', AdminUserParamsSchema), validate('body', UpdateAdminUserPasswordSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const { password } = req.body as { password: string }
  const updated = await AdminUsersService.updateAdminUserPassword(id, password, req.user)
  res.json(success(updated))
}))

router.delete('/:id', validate('params', AdminUserParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  await AdminUsersService.deleteAdminUser(id, req.user)
  res.json(success(null, 'User deleted'))
}))

export default router
