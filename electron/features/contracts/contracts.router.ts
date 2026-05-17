import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { CreateContractSchema } from './contracts.schema'
import * as ContractsService from './contracts.service'

const router = Router()

// Fetch all contracts (restricted to Admin and Agent)
router.get('/', authenticate, authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const filters: any = {}
  if (req.query.id_emp) filters.id_emp = Number(req.query.id_emp)
  if (req.query.status) filters.status = String(req.query.status)

  const contracts = await ContractsService.getContracts(filters)
  res.json(success(contracts))
}))

// Fetch currently logged-in employee's contracts
router.get('/my-contracts', authenticate, asyncHandler(async (req, res) => {
  const contracts = await ContractsService.getContracts({ id_emp: req.user.id_emp })
  res.json(success(contracts))
}))

// Create a new contract (restricted to Admin and Agent)
router.post('/', authenticate, authorize('Admin', 'Agent'), validate('body', CreateContractSchema), asyncHandler(async (req, res) => {
  const contract = await ContractsService.createContract(req.body, req.user.id_emp)
  res.json(success(contract))
}))

// Archive an existing contract (restricted to Admin and Agent)
router.post('/:id/archive', authenticate, authorize('Admin', 'Agent'), asyncHandler(async (req, res) => {
  const contract = await ContractsService.archiveContract(Number(req.params.id), req.user.id_emp)
  res.json(success(contract))
}))

export default router
