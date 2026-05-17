import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../lib/validate'
import { success } from '../../lib/response'
import {
  AgentParamsSchema,
  AssignDepartmentSchema,
  CreateAgentSchema,
  TeamMemberBodySchema,
  TeamMemberParamsSchema,
  UpdateAgentSchema,
} from './agents.schema'
import * as AgentsService from './agents.service'

const router = Router()

router.use(authenticate, authorize('Admin'))

router.get('/', asyncHandler(async (_req, res) => {
  const agents = await AgentsService.listAgents()
  res.json(success(agents))
}))

router.get('/:id', validate('params', AgentParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const agent = await AgentsService.getAgentById(id)
  res.json(success(agent))
}))

router.post('/', validate('body', CreateAgentSchema), asyncHandler(async (req, res) => {
  const agent = await AgentsService.createAgent(req.body, req.user.id_emp)
  res.status(201).json(success(agent))
}))

router.patch('/:id', validate('params', AgentParamsSchema), validate('body', UpdateAgentSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const agent = await AgentsService.updateAgent(id, req.body, req.user)
  res.json(success(agent))
}))

router.delete('/:id', validate('params', AgentParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  await AgentsService.deleteAgent(id, req.user)
  res.json(success(null, 'Agent deleted'))
}))

router.patch('/:id/department', validate('params', AgentParamsSchema), validate('body', AssignDepartmentSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const { id_dept } = req.body as { id_dept: number }
  const agent = await AgentsService.changeAgentDepartment(id, id_dept, req.user.id_emp)
  res.json(success(agent))
}))

router.get('/:id/team', validate('params', AgentParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const team = await AgentsService.getAgentTeam(id)
  res.json(success(team))
}))

router.post('/:id/team', validate('params', AgentParamsSchema), validate('body', TeamMemberBodySchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const { emp_id } = req.body as { emp_id: number }
  const result = await AgentsService.assignTeamMember(id, emp_id, req.user.id_emp)
  res.status(201).json(success(result))
}))

router.delete('/:id/team/:empId', validate('params', TeamMemberParamsSchema), asyncHandler(async (req, res) => {
  const { id, empId } = req.params as unknown as { id: number; empId: number }
  await AgentsService.removeTeamMember(id, empId, req.user.id_emp)
  res.json(success(null, 'Team member removed'))
}))

export default router
