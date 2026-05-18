import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Briefcase, Calendar, DollarSign, User } from 'lucide-react'
import { toast } from 'sonner'

interface Employee {
  id_emp: number
  name: string
}

interface ContractFormProps {
  onClose: () => void
  onSuccess?: () => void
  initialEmployeeId?: number
  initialStartDate?: string
}

export function ContractForm({ onClose, onSuccess, initialEmployeeId, initialStartDate }: ContractFormProps) {
  const queryClient = useQueryClient()
  const [idEmp, setIdEmp] = useState<number | ''>(initialEmployeeId || '')
  const [type, setType] = useState('CDI')
  const [startDate, setStartDate] = useState(initialStartDate?.split('T')[0] || '')
  const [endDate, setEndDate] = useState('')
  const [salary, setSalary] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
    enabled: !initialEmployeeId
  })

  // Update effect if props change (though usually they won't in this modal context)
  useEffect(() => {
    if (initialEmployeeId) setIdEmp(initialEmployeeId)
    if (initialStartDate) setStartDate(initialStartDate.split('T')[0])
  }, [initialEmployeeId, initialStartDate])

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
      toast.success('Contract created successfully')
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['employee', idEmp.toString()] })
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create contract'
      setError(msg)
      toast.error(msg)
    }
  })

  return (
    <div className="space-y-6 pt-2">
      {error && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-xl border border-destructive/20 font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Employee Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="h-3 w-3" /> Employee
          </Label>
          {initialEmployeeId ? (
            <div className="flex h-10 w-full items-center rounded-xl bg-muted/30 px-3 py-2 text-sm font-medium border border-border/50 text-foreground/80">
              {employees.find(e => e.id_emp === initialEmployeeId)?.name || `Employee #${initialEmployeeId}`}
            </div>
          ) : (
            <Select value={idEmp.toString()} onValueChange={(v) => setIdEmp(Number(v))}>
              <SelectTrigger className="h-10 rounded-xl bg-muted/20 border-none shadow-none focus:ring-1 focus:ring-primary/20">
                <SelectValue placeholder="Select an employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id_emp} value={emp.id_emp.toString()}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Contract Type */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-3 w-3" /> Contract Type
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-10 rounded-xl bg-muted/20 border-none shadow-none focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CDI">CDI (Indefinite)</SelectItem>
              <SelectItem value="CDD">CDD (Fixed Term)</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Start Date
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 rounded-xl bg-muted/20 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" /> End Date
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 rounded-xl bg-muted/20 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Salary */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-3 w-3" /> Base Salary (DA)
          </Label>
          <Input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="e.g. 85000"
            className="h-10 rounded-xl bg-muted/20 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending} className="rounded-xl px-6">
          Cancel
        </Button>
        <Button
          onClick={() => mutation.mutate()}
          className="rounded-xl px-8 shadow-lg shadow-primary/20"
          disabled={mutation.isPending || !idEmp || !startDate || !salary}
        >
          {mutation.isPending ? 'Saving...' : 'Create Contract'}
        </Button>
      </div>
    </div>
  )
}
