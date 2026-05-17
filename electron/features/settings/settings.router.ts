import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { UpdateSettingSchema } from './settings.schema'
import * as SettingsService from './settings.service'

const router = Router()

// Fetch all system settings (Authenticated)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const settings = await SettingsService.getSettings()
  res.json(success(settings))
}))

// Upsert a system setting (Admin or Agent)
router.post('/', authenticate, authorize('Admin', 'Agent'), validate('body', UpdateSettingSchema), asyncHandler(async (req, res) => {
  const { key, value } = req.body
  const setting = await SettingsService.updateSetting(key, value)
  res.json(success(setting))
}))

export default router
