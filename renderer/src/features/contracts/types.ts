export type ContractStatus = 'draft' | 'active' | 'pending-renewal' | 'expired' | 'terminated'
export type ContractType = 'permanent' | 'temporary' | 'internship' | 'consultant'

export type Contract = {
  id: number
  employeeId: number | null
  employeeName: string
  contractType: ContractType
  status: ContractStatus
  startDate: string
  endDate: string | null
  renewalDate: string | null
  salary: number
  description: string
  terms: string
  daysUntilExpiry: number
  isExpired: boolean
  createdAt: string
  updatedAt: string
}
