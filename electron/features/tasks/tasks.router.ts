import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { CreateTaskSchema, UpdateTaskSchema, TaskParamsSchema } from './tasks.schema'
import type { CreateTaskDTO, UpdateTaskDTO } from './tasks.types'
import * as TaskService from './tasks.service'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(async (req, res) => {
  const tasks = await TaskService.getTasks(req.user)
  res.json(success(tasks))
}))

router.post('/', authorize('Admin', 'Agent'), validate('body', CreateTaskSchema), asyncHandler(async (req, res) => {
  const task = await TaskService.createTask(req.body as CreateTaskDTO, req.user.id_emp)
  res.status(201).json(success(task))
}))

router.patch('/:id', validate('params', TaskParamsSchema), validate('body', UpdateTaskSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const task = await TaskService.updateTask(id, req.body as UpdateTaskDTO, req.user)
  res.json(success(task))
}))

router.delete('/:id', authorize('Admin'), validate('params', TaskParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  await TaskService.deleteTask(id)
  res.json(success(null))
}))

export default router
