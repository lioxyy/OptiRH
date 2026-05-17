import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { contractService } from './contract.service'

interface EmployeeRef {
  id_emp: number
  name: string
}

const emptyForm = {
  employeeId: '',
  contractType: 'permanent' as const,
  startDate: '',
  endDate: '',
  salary: '75000',
  description: '',
  terms: '',
}

type FormState = {
  employeeId: string
  contractType: 'permanent' | 'temporary' | 'internship' | 'consultant'
  startDate: string
  endDate: string
  salary: string
  description: string
  terms: string
}

export function ContractFormPage() {
  const { id } = useParams()
  const numericId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: employees = [] } = useQuery<EmployeeRef[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  const { data: current } = useQuery({
    queryKey: ['contract', numericId],
    queryFn: () => (numericId ? contractService.getContract(numericId) : Promise.resolve(null)),
    enabled: !!numericId,
  })

  const createMut = useMutation({
    mutationFn: (payload: any) => contractService.createContract(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ contractId, patch }: { contractId: number; patch: any }) => contractService.updateContract(contractId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  })

  const [form, setForm] = React.useState<FormState>(emptyForm)

  React.useEffect(() => {
    if (!current) return
    setForm({
      employeeId: current.employeeId ? String(current.employeeId) : '',
      contractType: current.contractType,
      startDate: current.startDate.split('T')[0],
      endDate: current.endDate ? current.endDate.split('T')[0] : '',
      salary: String(current.salary),
      description: current.description,
      terms: current.terms,
    })
  }, [current])

  function onChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setForm((state) => ({ ...state, [name]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const employee = employees.find((employee) => String(employee.id_emp) === form.employeeId)
    const payload = {
      employeeId: employee ? employee.id_emp : null,
      employeeName: employee?.name ?? 'Unassigned',
      contractType: form.contractType,
      status: numericId ? 'active' : 'draft' as const,
      startDate: form.startDate + 'T00:00:00.000Z',
      endDate: form.endDate ? form.endDate + 'T00:00:00.000Z' : null,
      renewalDate: null,
      salary: Number(form.salary),
      description: form.description,
      terms: form.terms,
    }

    if (numericId) {
      await updateMut.mutateAsync({ contractId: numericId, patch: payload })
    } else {
      await createMut.mutateAsync(payload)
    }

    navigate('/dashboard/contracts')
  }

  return (
    <div className="max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">{numericId ? 'Edit Contract' : 'New Contract'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Contract details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <Select value={form.employeeId || 'none'} onValueChange={(value) => setForm((state) => ({ ...state, employeeId: value === 'none' ? '' : value }))}>
              <SelectTrigger className="md:col-span-2">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id_emp} value={String(employee.id_emp)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={form.contractType} onValueChange={(value) => setForm((state) => ({ ...state, contractType: value as FormState['contractType'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Contract type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>

            <Input name="salary" value={form.salary} onChange={onChange} placeholder="75000" />
            <Input name="startDate" type="date" value={form.startDate} onChange={onChange} />
            <Input name="endDate" type="date" value={form.endDate} onChange={onChange} placeholder="Leave blank for permanent" />
            <Input name="description" value={form.description} onChange={onChange} placeholder="Job title / description" className="md:col-span-2" />
            <textarea
              name="terms"
              value={form.terms}
              onChange={onChange}
              placeholder="Contract terms and conditions"
              className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:col-span-2"
            />

            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">{numericId ? 'Save changes' : 'Create contract'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
