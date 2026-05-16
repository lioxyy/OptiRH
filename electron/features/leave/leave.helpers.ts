export function getDayCount(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Inclusive
}

export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(start)
  
  // Reset time to start of day for consistent iteration
  current.setHours(0, 0, 0, 0)
  const endOfDay = new Date(end)
  endOfDay.setHours(0, 0, 0, 0)

  while (current <= endOfDay) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

export function datesOverlap(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
  return s1 <= e2 && s2 <= e1
}
