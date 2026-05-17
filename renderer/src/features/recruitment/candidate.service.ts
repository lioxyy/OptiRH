import { type Candidate } from './types'

const STORAGE_KEY = 'optirh_candidates_v1'

function readStorage(): Candidate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Candidate[]
  } catch {
    return []
  }
}

function writeStorage(items: Candidate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function nextId(items: Candidate[]) {
  return items.reduce((max, it) => Math.max(max, it.id), 0) + 1
}

export const candidateService = {
  listCandidates(): Promise<Candidate[]> {
    return new Promise((resolve) => setTimeout(() => resolve(readStorage()), 150))
  },

  getCandidate(id: number): Promise<Candidate | null> {
    return new Promise((resolve) =>
      setTimeout(() => {
        const found = readStorage().find((c) => c.id === id) ?? null
        resolve(found)
      }, 120),
    )
  },

  createCandidate(payload: Omit<Candidate, 'id'>): Promise<Candidate> {
    return new Promise((resolve) =>
      setTimeout(() => {
        const items = readStorage()
        const id = nextId(items)
        const created: Candidate = { ...payload, id }
        items.unshift(created)
        writeStorage(items)
        resolve(created)
      }, 160),
    )
  },

  updateCandidate(id: number, patch: Partial<Candidate>): Promise<Candidate | null> {
    return new Promise((resolve) =>
      setTimeout(() => {
        const items = readStorage()
        let updated: Candidate | null = null
        const next = items.map((c) => {
          if (c.id === id) {
            updated = { ...c, ...patch }
            return updated
          }
          return c
        })
        writeStorage(next)
        resolve(updated)
      }, 160),
    )
  },

  deleteCandidate(id: number): Promise<boolean> {
    return new Promise((resolve) =>
      setTimeout(() => {
        const items = readStorage()
        const next = items.filter((c) => c.id !== id)
        writeStorage(next)
        resolve(true)
      }, 120),
    )
  },

  assignCandidate(id: number, recruiter: string): Promise<Candidate | null> {
    return this.updateCandidate(id, { recruiter })
  },

  advanceCandidate(id: number, nextStage: string): Promise<Candidate | null> {
    return this.updateCandidate(id, { stage: nextStage as any })
  },

  rejectCandidate(id: number): Promise<Candidate | null> {
    return this.updateCandidate(id, { status: 'closed' as any, stage: 'Rejected' as any })
  },
}
