import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

interface ContractFormProps {
  onClose: () => void
}

export function ContractForm({ onClose }: ContractFormProps) {
  const queryClient = useQueryClient()
  const [idEmp, setIdEmp] = useState<number | ''>('')
  const [type, setType] = useState('CDI')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [salary, setSalary] = useState('')
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
      await api.post('/api/contracts', {
        id_emp: Number(idEmp),
        type,
        date_deb: new Date(startDate).toISOString(),
        date_fin: endDate ? new Date(endDate).toISOString() : null,
        salaire_base: Number(salary),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create contract')
    }
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add New Contract</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md font-medium">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee</label>
            <select
              value={idEmp}
              onChange={(e) => setIdEmp(e.target.value ? Number(e.target.value) : '')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select an employee...</option>
              {employees.map((emp: any) => (
                <option key={emp.id_emp} value={emp.id_emp}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contract Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="CDI">CDI (Indefinite)</option>
              <option value="CDD">CDD (Fixed Term)</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Base Salary (DA)</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="e.g. 85000"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button 
              onClick={() => mutation.mutate()} 
              disabled={mutation.isPending || !idEmp || !startDate || !salary}
            >
              {mutation.isPending ? 'Saving...' : 'Create Contract'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
