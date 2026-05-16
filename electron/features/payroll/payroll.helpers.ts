export function getWorkingDays(start: Date, end: Date): number {
  let count = 0
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  while (current <= endDate) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }

  return count
}

export function prorateSalary(
  baseSalary: number,
  monthYear: string,
  contractStartDate: Date,
): number {
  const [year, month] = monthYear.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  const workingDays = getWorkingDays(monthStart, monthEnd)
  if (workingDays === 0) return 0

  const contractStart = new Date(contractStartDate)
  contractStart.setHours(0, 0, 0, 0)

  const effectiveStart = contractStart > monthStart ? contractStart : monthStart
  const daysWorked = getWorkingDays(effectiveStart, monthEnd)

  return Math.round((baseSalary / workingDays) * daysWorked * 100) / 100
}
