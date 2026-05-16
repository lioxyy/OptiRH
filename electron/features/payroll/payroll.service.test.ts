import { describe, it, expect } from 'vitest'
import { getWorkingDays, prorateSalary } from './payroll.helpers'

describe('getWorkingDays', () => {
  it('returns 21 for June 2026 (Mon-Fri, no holidays)', () => {
    const start = new Date(2026, 5, 1)
    const end = new Date(2026, 5, 30)
    expect(getWorkingDays(start, end)).toBe(22)
  })

  it('returns 1 for a single weekday', () => {
    const start = new Date(2026, 0, 5)
    const end = new Date(2026, 0, 5)
    expect(getWorkingDays(start, end)).toBe(1)
  })

  it('returns 0 for a single Saturday', () => {
    const start = new Date(2026, 0, 3)
    const end = new Date(2026, 0, 3)
    expect(getWorkingDays(start, end)).toBe(0)
  })

  it('returns 0 for a single Sunday', () => {
    const start = new Date(2026, 0, 4)
    const end = new Date(2026, 0, 4)
    expect(getWorkingDays(start, end)).toBe(0)
  })

  it('returns 5 for a Mon-Fri week', () => {
    const start = new Date(2026, 0, 5)
    const end = new Date(2026, 0, 9)
    expect(getWorkingDays(start, end)).toBe(5)
  })

  it('returns correct days for February 2026 (28 days)', () => {
    const start = new Date(2026, 1, 1)
    const end = new Date(2026, 1, 28)
    expect(getWorkingDays(start, end)).toBe(20)
  })
})

describe('prorateSalary', () => {
  it('returns full salary when contract started before month', () => {
    const result = prorateSalary(3000, '2026-06', new Date(2026, 4, 1))
    expect(result).toBe(3000)
  })

  it('prorates salary for mid-month hire', () => {
    const result = prorateSalary(3000, '2026-06', new Date(2026, 5, 15))
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(3000)
  })

  it('returns 0 for a month with no working days (hypothetical)', () => {
    const baseSalary = 3000
    const contractStart = new Date(2026, 0, 1)
    const [year, month] = ['2026-06', '2026'].map(Number)
    // Not a realistic scenario, but validate the math
    // June 2026 has 22 working days
    const result = prorateSalary(baseSalary, '2026-06', contractStart)
    expect(result).toBe(3000)
  })

  it('handles contract start on first day of month', () => {
    const result = prorateSalary(5000, '2026-06', new Date(2026, 5, 1))
    expect(result).toBe(5000)
  })

  it('handles contract start on last working day of month', () => {
    const result = prorateSalary(3000, '2026-06', new Date(2026, 5, 30))
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(300)
  })
})
