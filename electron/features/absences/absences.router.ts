import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { LogManualAbsenceSchema, UploadJustificationSchema, ReviewJustificationSchema } from './absences.schema'
import * as AbsencesService from './absences.service'

const router = Router()

// Fetch all absences (restricted to Admin and Agent)
router.get('/', authenticate, authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const filters: any = {}
  if (req.query.id_emp) filters.id_emp = Number(req.query.id_emp)
  if (req.query.is_justified) filters.is_justified = req.query.is_justified === 'true'
  if (req.query.justification_status) filters.justification_status = String(req.query.justification_status)

  const absences = await AbsencesService.getAbsences(filters)
  res.json(success(absences))
}))

// Fetch currently logged-in employee's absences
router.get('/my-absences', authenticate, asyncHandler(async (req, res) => {
  const absences = await AbsencesService.getAbsences({ id_emp: req.user.id_emp })
  res.json(success(absences))
}))

// Manually log an absence (Admin or Agent)
router.post('/', authenticate, authorize('Admin', 'Agent'), validate('body', LogManualAbsenceSchema), asyncHandler(async (req, res) => {
  const absence = await AbsencesService.logManualAbsence(req.body, req.user.id_emp)
  res.json(success(absence))
}))

// Upload justification document for an absence
router.post('/:id/justify', authenticate, validate('body', UploadJustificationSchema), asyncHandler(async (req, res) => {
  const { fileBase64, originalFileName } = req.body
  const result = await AbsencesService.submitJustification(
    Number(req.params.id),
    fileBase64,
    originalFileName,
    req.user.id_emp
  )
  res.json(success(result))
}))

// Review/Approve/Reject justification (Admin or Agent)
router.post('/:id/review-justification', authenticate, authorize('Admin', 'Agent'), validate('body', ReviewJustificationSchema), asyncHandler(async (req, res) => {
  const { status, reject_reason } = req.body
  const result = await AbsencesService.validateJustification(
    Number(req.params.id),
    status,
    reject_reason || null,
    req.user.id_emp
  )
  res.json(success(result))
}))

export default router
