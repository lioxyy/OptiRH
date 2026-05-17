import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminUsersService } from './admin-users.service'
import type { AdminUserPayload, Role } from './types'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Department = { id_dept: number; name: string }
type Employee = { id_emp: number; name: string; email: string }

type FormState = {
  name: string
  email: string
  phone: string
  role: Role
  id_dept: string
  supervisor_id: string
  password: string
  date_birth: string
  date_employment: string
  gender: string
  address: string
}

const initialState: FormState = {
  name: '',
  email: '',
  phone: '',
  role: 'Employee',
  id_dept: '',
  supervisor_id: '',
  password: '',
  date_birth: '',
  date_employment: '',
  gender: '',
  address: '',
}

function toIsoDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toISOString()
}

export function AdminUserFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const numericId = id ? Number(id) : null
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = React.useState<FormState>(initialState)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/api/employees/departments')
      return res.data.data
    },
  })

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  const { data: current } = useQuery({
    queryKey: ['admin-user', numericId],
    queryFn: () => adminUsersService.getUser(numericId as number),
    enabled: isEdit && Boolean(numericId),
  })

  React.useEffect(() => {
    if (!current) return
    setForm({
      name: current.name,
      email: current.email,
      phone: current.phone ?? '',
      role: current.role,
      id_dept: String(current.id_dept),
      supervisor_id: current.supervisor_id ? String(current.supervisor_id) : '',
      password: '',
      date_birth: current.date_birth?.split('T')[0] ?? '',
      date_employment: current.date_employment?.split('T')[0] ?? '',
      gender: current.gender ?? '',
      address: current.address ?? '',
    })
  }, [current])

  React.useEffect(() => {
    if (!isEdit && !form.id_dept && departments.length > 0) {
      setForm((state) => ({ ...state, id_dept: String(departments[0].id_dept) }))
    }
  }, [departments, form.id_dept, isEdit])

  const createMut = useMutation({
    mutationFn: (payload: AdminUserPayload) => adminUsersService.createUser(payload),
    onSuccess: () => {
      toast.success('User created')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      navigate('/dashboard/admin-users')
    },
    onError: (error: any) => {
      const details = error?.response?.data?.details
      const message = error?.response?.data?.message || error?.message || 'Failed to create user'
      if (Array.isArray(details) && details.length > 0) {
        toast.error(`${message}: ${details.map((item: { field?: string; message?: string }) => `${item.field || 'field'} ${item.message || 'is invalid'}`).join('; ')}`)
        return
      }
      toast.error(message)
    },
  })

  const updateMut = useMutation({
    mutationFn: () =>
      adminUsersService.updateUser(numericId as number, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        id_dept: Number(form.id_dept),
        supervisor_id: form.supervisor_id ? Number(form.supervisor_id) : undefined,
        date_birth: form.date_birth ? toIsoDate(form.date_birth) : undefined,
        date_employment: form.date_employment ? toIsoDate(form.date_employment) : undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
      }),
    onSuccess: () => {
      toast.success('User updated')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      navigate('/dashboard/admin-users')
    },
    onError: (error: any) => {
      const details = error?.response?.data?.details
      const message = error?.response?.data?.message || error?.message || 'Failed to update user'
      if (Array.isArray(details) && details.length > 0) {
        toast.error(`${message}: ${details.map((item: { field?: string; message?: string }) => `${item.field || 'field'} ${item.message || 'is invalid'}`).join('; ')}`)
        return
      }
      toast.error(message)
    },
  })

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    const normalizedEmail = form.email.trim().toLowerCase()
    const duplicate = employees.find((employee) => employee.email.trim().toLowerCase() === normalizedEmail)
    if (!isEdit && duplicate) {
      toast.error('Email already exists. Use a different email address.')
      return
    }

    if (!form.name || !form.email || !form.id_dept) {
      toast.error('Name, email, and department are required')
      return
    }

    if (!isEdit && (!form.password || !form.date_birth || !form.date_employment)) {
      toast.error('Password, date of birth, and employment date are required')
      return
    }

    if (!isEdit && form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    const payload = {
      name: form.name.trim(),
      email: normalizedEmail,
      phone: form.phone.trim() || undefined,
      role: form.role,
      id_dept: Number(form.id_dept),
      supervisor_id: form.supervisor_id ? Number(form.supervisor_id) : undefined,
      password: form.password,
      date_birth: toIsoDate(form.date_birth),
      date_employment: toIsoDate(form.date_employment),
      gender: form.gender.trim() || undefined,
      address: form.address.trim() || undefined,
    }

    try {
      setIsSubmitting(true)
      if (isEdit) {
        await updateMut.mutateAsync()
      } else {
        await createMut.mutateAsync(payload)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save user'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit admin user' : 'Create admin user'}</CardTitle>
          <CardDescription>Manage user profile, role, and access metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
            </Field>
            <Field label="Role">
              <Select value={form.role} onValueChange={(v) => setForm((s) => ({ ...s, role: v as Role }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Department">
              <Select value={form.id_dept || '__none__'} onValueChange={(v) => setForm((s) => ({ ...s, id_dept: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments.map((d) => <SelectItem key={d.id_dept} value={String(d.id_dept)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Supervisor">
              <Select value={form.supervisor_id || '__none__'} onValueChange={(v) => setForm((s) => ({ ...s, supervisor_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {employees.map((e) => <SelectItem key={e.id_emp} value={String(e.id_emp)}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {!isEdit && (
              <Field label="Password">
                <Input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Use at least 6 characters.</p>
              </Field>
            )}
            <Field label="Date of birth">
              <Input type="date" value={form.date_birth} onChange={(e) => setForm((s) => ({ ...s, date_birth: e.target.value }))} />
            </Field>
            <Field label="Employment date">
              <Input type="date" value={form.date_employment} onChange={(e) => setForm((s) => ({ ...s, date_employment: e.target.value }))} />
            </Field>
            <Field label="Gender">
              <Input value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))} />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <Input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
            </Field>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/admin-users')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  )
}
