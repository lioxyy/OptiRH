import type { Contract } from './types'

const STORAGE_KEY = 'optirh_contracts_v1'

const seedContracts: Contract[] = [
  {
    id: 1,
    employeeId: 1,
    employeeName: 'Sarah Chen',
    contractType: 'permanent',
    status: 'active',
    startDate: '2023-06-15T00:00:00.000Z',
    endDate: null,
    renewalDate: null,
    salary: 95000,
    description: 'Senior HR Business Partner',
    terms: 'Full-time employment, benefits package, 4 weeks PTO',
    daysUntilExpiry: -1,
    isExpired: false,
    createdAt: '2023-06-15T09:00:00.000Z',
    updatedAt: '2026-05-17T12:00:00.000Z',
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: 'Marcus Johnson',
    contractType: 'temporary',
    status: 'pending-renewal',
    startDate: '2024-09-01T00:00:00.000Z',
    endDate: '2026-08-31T00:00:00.000Z',
    renewalDate: '2026-08-15T00:00:00.000Z',
    salary: 72000,
    description: 'Contract Recruiter',
    terms: '12-month contract, eligible for renewal',
    daysUntilExpiry: 106,
    isExpired: false,
    createdAt: '2024-09-01T09:00:00.000Z',
    updatedAt: '2026-05-17T12:00:00.000Z',
  },
  {
    id: 3,
    employeeId: 3,
    employeeName: 'Alicia Torres',
    contractType: 'internship',
    status: 'expired',
    startDate: '2025-06-01T00:00:00.000Z',
    endDate: '2025-12-31T00:00:00.000Z',
    renewalDate: null,
    salary: 0,
    description: 'Summer HR Internship (unpaid)',
    terms: '6-month internship, learning focus',
    daysUntilExpiry: -137,
    isExpired: true,
    createdAt: '2025-06-01T09:00:00.000Z',
    updatedAt: '2026-05-17T12:00:00.000Z',
  },
  {
    id: 4,
    employeeId: 4,
    employeeName: 'David Kim',
    contractType: 'consultant',
    status: 'terminated',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2025-12-31T00:00:00.000Z',
    renewalDate: null,
    salary: 85000,
    description: 'External HR Consultant',
    terms: 'Fixed-term consultant, 2-year engagement',
    daysUntilExpiry: -137,
    isExpired: true,
    createdAt: '2024-01-01T09:00:00.000Z',
    updatedAt: '2026-05-17T12:00:00.000Z',
  },
]

function readStorage(): Contract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedContracts
    return JSON.parse(raw) as Contract[]
  } catch {
    return seedContracts
  }
}

function writeStorage(items: Contract[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function nextId(items: Contract[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function calculateExpiry(endDate: string | null): { daysUntilExpiry: number; isExpired: boolean } {
  if (!endDate) return { daysUntilExpiry: -1, isExpired: false }
  const end = new Date(endDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { daysUntilExpiry: diff, isExpired: diff < 0 }
}

function delay<T>(value: T, ms = 140) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
}

export const contractService = {
  listContracts(): Promise<Contract[]> {
    return delay(readStorage())
  },

  getContract(id: number): Promise<Contract | null> {
    return delay(readStorage().find((item) => item.id === id) ?? null)
  },

  createContract(payload: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'daysUntilExpiry' | 'isExpired'>): Promise<Contract> {
    const items = readStorage()
    const now = new Date().toISOString()
    const { daysUntilExpiry, isExpired } = calculateExpiry(payload.endDate)
    const created: Contract = {
      ...payload,
      id: nextId(items),
      daysUntilExpiry,
      isExpired,
      createdAt: now,
      updatedAt: now,
    }
    const next = [created, ...items]
    writeStorage(next)
    return delay(created)
  },

  updateContract(id: number, patch: Partial<Contract>): Promise<Contract | null> {
    const items = readStorage()
    let updated: Contract | null = null
    const now = new Date().toISOString()
    const next = items.map((item) => {
      if (item.id !== id) return item
      const { daysUntilExpiry, isExpired } = calculateExpiry(patch.endDate ?? item.endDate)
      updated = { ...item, ...patch, daysUntilExpiry, isExpired, updatedAt: now }
      return updated
    })
    writeStorage(next)
    return delay(updated)
  },

  deleteContract(id: number): Promise<boolean> {
    const next = readStorage().filter((item) => item.id !== id)
    writeStorage(next)
    return delay(true)
  },

  updateStatus(id: number, status: Contract['status']): Promise<Contract | null> {
    return this.updateContract(id, { status })
  },

  renewContract(id: number, newEndDate: string): Promise<Contract | null> {
    return this.updateContract(id, { endDate: newEndDate, status: 'active', renewalDate: null })
  },

  terminateContract(id: number): Promise<Contract | null> {
    return this.updateContract(id, { status: 'terminated', endDate: new Date().toISOString().split('T')[0] })
  },
}
