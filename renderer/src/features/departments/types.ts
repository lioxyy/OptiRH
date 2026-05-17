export type DepartmentStatus = 'active' | 'archived'

export type Department = {
  id: number
  name: string
  code: string
  description: string
  managerId: number | null
  managerName: string
  location: string
  budget: number
  headcountTarget: number
  status: DepartmentStatus
  createdAt: string
  updatedAt: string
}
