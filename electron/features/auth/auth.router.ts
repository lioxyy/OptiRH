import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { success } from '../../lib/response'
import { LoginSchema, RefreshSchema } from './auth.schema'
import type { LoginDTO, RefreshDTO } from './auth.types'
import * as AuthService from './auth.service'

const router = Router()

router.post(
  '/login',
  validate('body', LoginSchema),
  asyncHandler(async (req, res) => {
    const result = await AuthService.login(
      (req.body as LoginDTO).email,
      (req.body as LoginDTO).password,
    )
    res.json(success(result))
  }),
)

router.post(
  '/refresh',
  validate('body', RefreshSchema),
  asyncHandler(async (req, res) => {
    const result = await AuthService.refresh((req.body as RefreshDTO).refresh_token)
    res.json(success(result))
  }),
)

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const employee = await AuthService.getMe(req.user.id_emp)
    res.json(success(employee))
  }),
)

export default router
