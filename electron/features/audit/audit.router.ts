import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { AuditQuerySchema } from './audit.schema'
import type { AuditQuery } from './audit.types'
import * as AuditService from './audit.service'

const router = Router()

router.use(authenticate)
router.use(authorize('Admin'))

router.get(
  '/',
  validate('query', AuditQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await AuditService.getAuditLogs(req.query as unknown as AuditQuery)
    res.json(success(result))
  }),
)

export default router
