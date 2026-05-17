import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { agentsService } from './agents.service'
import type { CreateAgentPayload, Department } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type FormState = {
  name: string
  email: string
  phone: string
  gender: string
  address: string
  date_birth: string
  date_employment: string
  id_dept: string
  supervisor_id: string
  password: string
}

const empty: FormState = {
  name: '', email: '', phone: '', gender: '', address: '',
  date_birth: '', date_employment: '', id_dept: '', supervisor_id: '', password: '',
}

function toIso(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toISOString()
}

export function AgentFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const numericId = id ? Number(id) : null
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<FormState>(empty)

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => agentsService.listDepartments(),
  })

  const { data: employees = [] } = useQuery<{ id_emp: number; name: string; role: string }[]>({
    queryKey: ['employees'],
    queryFn: () => agentsService.listAllEmployees(),
  })

  const { data: current } = useQuery({
    queryKey: ['agent', numericId],
    queryFn: () => agentsService.getAgent(numericId as number),
    enabled: isEdit && !!numericId,
  })

  React.useEffect(() => {
    if (!current) return
    setForm({
      name: current.name,
      email: current.email,
      phone: current.phone ?? '',
      gender: current.gender ?? '',
      address: current.address ?? '',
      date_birth: current.date_birth?.split('T')[0] ?? '',
      date_employment: current.date_employment?.split('T')[0] ?? '',
      id_dept: String(current.id_dept),
      supervisor_id: current.supervisor_id ? String(current.supervisor_id) : '',
      password: '',
    })
  }, [current])

  const createMut = useMutation({
    mutationFn: (payload: CreateAgentPayload) => agentsService.createAgent(payload),
    onSuccess: () => {
      toast.success('Agent created')
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      navigate('/dashboard/agents')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create agent'
      toast.error(msg)
    },
  })

  const updateMut = useMutation({
    mutationFn: () =>
      agentsService.updateAgent(numericId as number, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        date_birth: form.date_birth ? toIso(form.date_birth) : undefined,
        date_employment: form.date_employment ? toIso(form.date_employment) : undefined,
        id_dept: Number(form.id_dept),
        supervisor_id: form.supervisor_id ? Number(form.supervisor_id) : undefined,
      }),
    onSuccess: () => {
      toast.success('Agent updated')
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agent', numericId] })
      navigate('/dashboard/agents')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to update agent'
      toast.error(msg)
    },
  })

  const isSaving = createMut.isPending || updateMut.isPending

  function set(key: keyof FormState, value: string) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.id_dept) {
      toast.error('Name, email, and department are required')
      return
    }
    if (!isEdit && !form.password) {
      toast.error('Password is required')
      return
    }
    if (!isEdit && form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (!isEdit && (!form.date_birth || !form.date_employment)) {
      toast.error('Date of birth and employment date are required')
      return
    }
    if (isEdit) {
      updateMut.mutate()
    } else {
      createMut.mutate({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        date_birth: toIso(form.date_birth),
        date_employment: toIso(form.date_employment),
        id_dept: Number(form.id_dept),
        supervisor_id: form.supervisor_id ? Number(form.supervisor_id) : undefined,
        password: form.password,
      })
    }
  }

  const supervisorOptions = employees.filter((e) => e.id_emp !== numericId)

  return (
    <div className="max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit agent' : 'New agent'}</CardTitle>
          <CardDescription>
            {isEdit ? 'Update agent profile and department assignment.' : 'Create a new agent account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" required />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="agent@company.com" required />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555-0000" />
            </Field>
            <Field label="Gender">
              <Input value={form.gender} onChange={(e) => set('gender', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.date_birth} onChange={(e) => set('date_birth', e.target.value)} />
            </Field>
            <Field label="Employment date">
              <Input type="date" value={form.date_employment} onChange={(e) => set('date_employment', e.target.value)} />
            </Field>
            <Field label="Department">
              <Select
                value={form.id_dept || '__none__'}
                onValueChange={(v) => set('id_dept', v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id_dept} value={String(d.id_dept)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Supervisor">
              <Select
                value={form.supervisor_id || '__none__'}
                onValueChange={(v) => set('supervisor_id', v === '__none__' ? '' : v)}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {supervisorOptions.map((e) => (
                    <SelectItem key={e.id_emp} value={String(e.id_emp)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {!isEdit && (
              <Field label="Password" className="md:col-span-2">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </Field>
            )}
            <Field label="Address" className="md:col-span-2">
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Optional" />
            </Field>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : isEdit ? 'Save changes' : 'Create agent'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/agents')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  )
}
