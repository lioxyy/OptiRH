import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { validate } from '../../lib/validate'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { success } from '../../lib/response'
import {
  CreateContractSchema,
  ContractParamsSchema
} from './contracts.schema'
import type { CreateContractDTO } from './contracts.types'
import * as ContractService from './contracts.service'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(async (req, res) => {
  const filters: any = {}

  // If not Admin/Agent, restrict to self
  if (req.user.role === 'Employee') {
    filters.id_emp = req.user.id_emp
  } else {
    // Admins/Agents can filter by a specific employee if provided
    if (req.query.id_emp) {
      filters.id_emp = Number(req.query.id_emp)
    }
  }

  if (req.query.status) {
    filters.status = req.query.status as string
  }

  const contracts = await ContractService.getContracts(filters)
  res.json(success(contracts))
}))

router.post('/', authorize('Admin'), validate('body', CreateContractSchema), asyncHandler(async (req, res) => {
  const contract = await ContractService.createContract(req.body as CreateContractDTO, req.user.id_emp)
  res.status(201).json(success(contract))
}))

router.patch('/:id/terminate', authorize('Admin'), validate('params', ContractParamsSchema), asyncHandler(async (req, res) => {
  const { id } = req.params as unknown as { id: number }
  const contract = await ContractService.terminateContract(id, req.user.id_emp)
  res.json(success(contract))
}))

export default router
