import type { Department } from './types'

const STORAGE_KEY = 'optirh_departments_v1'

const seedDepartments: Department[] = [
  {
    id: 1,
    name: 'Human Resources',
    code: 'HR',
    description: 'Owns policy, employee relations, and talent operations.',
    managerId: null,
    managerName: 'Unassigned',
    location: 'HQ - Floor 5',
    budget: 180000,
    headcountTarget: 12,
    status: 'active',
    createdAt: '2026-01-08T09:00:00.000Z',
    updatedAt: '2026-05-10T12:00:00.000Z',
  },
  {
    id: 2,
    name: 'Talent Acquisition',
    code: 'TA',
    description: 'Manages recruitment, sourcing, and pipeline performance.',
    managerId: null,
    managerName: 'Unassigned',
    location: 'HQ - Floor 3',
    budget: 145000,
    headcountTarget: 9,
    status: 'active',
    createdAt: '2026-01-12T09:00:00.000Z',
    updatedAt: '2026-05-12T12:00:00.000Z',
  },
  {
    id: 3,
    name: 'Payroll Operations',
    code: 'PAY',
    description: 'Handles payroll processing, compensation, and compliance.',
    managerId: null,
    managerName: 'Unassigned',
    location: 'HQ - Floor 4',
    budget: 98000,
    headcountTarget: 6,
    status: 'active',
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-05-14T12:00:00.000Z',
  },
]

function readStorage(): Department[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedDepartments
    return JSON.parse(raw) as Department[]
  } catch {
    return seedDepartments
  }
}

function writeStorage(items: Department[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function nextId(items: Department[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function delay<T>(value: T, ms = 140) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
}

export const departmentService = {
  listDepartments(): Promise<Department[]> {
    return delay(readStorage())
  },

  getDepartment(id: number): Promise<Department | null> {
    return delay(readStorage().find((item) => item.id === id) ?? null)
  },

  createDepartment(payload: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
    const items = readStorage()
    const now = new Date().toISOString()
    const created: Department = {
      ...payload,
      id: nextId(items),
      createdAt: now,
      updatedAt: now,
    }
    const next = [created, ...items]
    writeStorage(next)
    return delay(created)
  },

  updateDepartment(id: number, patch: Partial<Department>): Promise<Department | null> {
    const items = readStorage()
    let updated: Department | null = null
    const now = new Date().toISOString()
    const next = items.map((item) => {
      if (item.id !== id) return item
      updated = { ...item, ...patch, updatedAt: now }
      return updated
    })
    writeStorage(next)
    return delay(updated)
  },

  deleteDepartment(id: number): Promise<boolean> {
    const next = readStorage().filter((item) => item.id !== id)
    writeStorage(next)
    return delay(true)
  },

  assignManager(id: number, managerId: number | null, managerName: string): Promise<Department | null> {
    return this.updateDepartment(id, { managerId, managerName: managerName || 'Unassigned' })
  },

  archiveDepartment(id: number): Promise<Department | null> {
    return this.updateDepartment(id, { status: 'archived' })
  },
}
