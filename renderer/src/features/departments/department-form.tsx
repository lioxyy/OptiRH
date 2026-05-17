import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { departmentService } from './department.service'

interface EmployeeRef {
  id_emp: number
  name: string
}

const emptyForm = {
  name: '',
  code: '',
  description: '',
  managerId: '',
  location: '',
  budget: '100000',
  headcountTarget: '5',
  status: 'active' as 'active' | 'archived',
}

type FormState = {
  name: string
  code: string
  description: string
  managerId: string
  location: string
  budget: string
  headcountTarget: string
  status: 'active' | 'archived'
}

export function DepartmentFormPage() {
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
    queryKey: ['department', numericId],
    queryFn: () => (numericId ? departmentService.getDepartment(numericId) : Promise.resolve(null)),
    enabled: !!numericId,
  })

  const createMut = useMutation({
    mutationFn: (payload: any) => departmentService.createDepartment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ departmentId, patch }: { departmentId: number; patch: any }) => departmentService.updateDepartment(departmentId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })

  const [form, setForm] = React.useState<FormState>(emptyForm)

  React.useEffect(() => {
    if (!current) return
    setForm({
      name: current.name,
      code: current.code,
      description: current.description,
      managerId: current.managerId ? String(current.managerId) : '',
      location: current.location,
      budget: String(current.budget),
      headcountTarget: String(current.headcountTarget),
      status: current.status,
    })
  }, [current])

  function onChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setForm((state) => ({ ...state, [name]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const manager = employees.find((employee) => String(employee.id_emp) === form.managerId)
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description,
      managerId: manager ? manager.id_emp : null,
      managerName: manager?.name ?? 'Unassigned',
      location: form.location,
      budget: Number(form.budget),
      headcountTarget: Number(form.headcountTarget),
      status: form.status,
    }

    if (numericId) {
      await updateMut.mutateAsync({ departmentId: numericId, patch: payload })
    } else {
      await createMut.mutateAsync(payload)
    }

    navigate('/dashboard/departments')
  }

  return (
    <div className="max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">{numericId ? 'Edit Department' : 'New Department'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Department details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <Input name="name" value={form.name} onChange={onChange} placeholder="Finance" />
            <Input name="code" value={form.code} onChange={onChange} placeholder="FIN" />
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Department description" className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:col-span-2" />
            <Input name="location" value={form.location} onChange={onChange} placeholder="HQ - Floor 2" />
            <Input name="budget" value={form.budget} onChange={onChange} placeholder="120000" />
            <Input name="headcountTarget" value={form.headcountTarget} onChange={onChange} placeholder="8" />
            <Select value={form.status} onValueChange={(value) => setForm((state): FormState => ({ ...state, status: value as FormState['status'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.managerId || 'none'} onValueChange={(value) => setForm((state) => ({ ...state, managerId: value === 'none' ? '' : value }))}>
              <SelectTrigger className="md:col-span-2">
                <SelectValue placeholder="Assign manager" />
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
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit">{numericId ? 'Save changes' : 'Create department'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
