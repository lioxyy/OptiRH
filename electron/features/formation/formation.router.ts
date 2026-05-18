import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
    CreateFormationSchema,
    UpdateFormationSchema,
    FormationParamsSchema,
    AssignInstructorSchema,
    ScheduleFormationSchema,
    ParticipantBodySchema,
    ParticipantParamsSchema
} from './formation.schema'
import type { CreateFormationDTO, UpdateFormationDTO } from './formation.types'
import * as FormationService from './formation.service'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(async (_req, res) => {
    const items = await FormationService.getFormations()
    res.json(success(items))
}))

router.get('/:id', validate('params', FormationParamsSchema), asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    const f = await FormationService.getFormationById(id)
    res.json(success(f))
}))

router.post('/', authorize('Admin'), validate('body', CreateFormationSchema), asyncHandler(async (req, res) => {
    const item = await FormationService.createFormation(req.body as CreateFormationDTO, req.user.id_emp)
    res.status(201).json(success(item))
}))

router.patch('/:id', authorize('Admin'), validate('params', FormationParamsSchema), validate('body', UpdateFormationSchema), asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    const item = await FormationService.updateFormation(id, req.body as UpdateFormationDTO, req.user.id_emp)
    res.json(success(item))
}))

router.delete('/:id', authorize('Admin'), validate('params', FormationParamsSchema), asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    await FormationService.deleteFormation(id, req.user.id_emp)
    res.json(success(null, 'Formation deleted'))
}))

router.post('/:id/assign-instructor', authorize('Admin'), validate('params', FormationParamsSchema), validate('body', AssignInstructorSchema), asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    const { instructor_id } = req.body as { instructor_id: number }
    const updated = await FormationService.assignInstructor(id, instructor_id, req.user.id_emp)
    res.json(success(updated))
}))

router.post('/:id/schedule', authorize('Admin'), validate('params', FormationParamsSchema), validate('body', ScheduleFormationSchema), asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    const { date_deb, duration_days } = req.body as { date_deb?: string, duration_days?: number }
    const updated = await FormationService.scheduleFormation(id, date_deb, duration_days, req.user.id_emp)
    res.json(success(updated))
}))

router.get('/:id/participants', validate('params', FormationParamsSchema), asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    const participants = await FormationService.getParticipants(id)
    res.json(success(participants))
}))

router.post('/:id/participants', authorize('Admin'), validate('params', FormationParamsSchema), validate('body', ParticipantBodySchema), asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as { id: number }
    const { emp_id } = req.body as { emp_id: number }
    const result = await FormationService.addParticipant(id, emp_id, req.user.id_emp)
    res.status(201).json(success(result))
}))

router.delete('/:id/participants/:empId', authorize('Admin'), validate('params', ParticipantParamsSchema), asyncHandler(async (req, res) => {
    const { id, empId } = req.params as unknown as { id: number; empId: number }
    await FormationService.removeParticipant(id, empId, req.user.id_emp)
    res.json(success(null, 'Participant removed'))
}))

export default router
