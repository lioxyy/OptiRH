import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { success } from '../../lib/response'
import { NotificationParamsSchema, NotificationQuerySchema } from './notifications.schema'
import type { NotificationParams } from './notifications.types'
import * as NotificationService from './notifications.service'

const router = Router()

router.use(authenticate)

router.get(
  '/',
  validate('query', NotificationQuerySchema),
  asyncHandler(async (req, res) => {
    const notifications = await NotificationService.getNotifications(
      req.user.id_emp,
      req.query.is_read as string | undefined,
    )
    res.json(success(notifications))
  }),
)

router.patch(
  '/:id',
  validate('params', NotificationParamsSchema),
  asyncHandler(async (req, res) => {
    const notification = await NotificationService.markAsRead(
      (req.params as unknown as NotificationParams).id,
      req.user.id_emp,
    )
    res.json(success(notification))
  }),
)

export default router
