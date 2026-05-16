import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

interface PayrollFormProps {
  onClose: () => void
}

export function PayrollForm({ onClose }: PayrollFormProps) {
  const queryClient = useQueryClient()
  const [employeeId, setEmployeeId] = useState<number | ''>('')
  const [monthYear, setMonthYear] = useState('')
  const [bonus, setBonus] = useState('0')
  const [deductions, setDeductions] = useState('0')
  const [error, setError] = useState<string | null>(null)

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    }
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/payroll/generate', {
        id_emp: Number(employeeId),
        month_year: monthYear,
        bonus_amount: Number(bonus),
        absence_deductions: Number(deductions),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to generate payslip')
    }
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Generate Payslip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md font-medium">{error}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select an employee...</option>
              {employees.map((emp: any) => (
                <option key={emp.id_emp} value={emp.id_emp}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Period (YYYY-MM)</label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bonus (DA)</label>
              <input
                type="number"
                min="0"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deductions (DA)</label>
              <input
                type="number"
                min="0"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !employeeId || !monthYear}
            >
              {mutation.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
