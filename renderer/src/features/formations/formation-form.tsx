import * as React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createFormation, getFormation, listEmployees, updateFormation } from './formation.service'
import type { CreateFormationPayload, EmployeeRef } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function FormationForm() {
  const { id } = useParams()
  const numericId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [payload, setPayload] = React.useState<CreateFormationPayload>({
    name: '',
    description: '',
    location: '',
    date_deb: '',
    duration_days: 1,
    instructor_id: 0,
  })

  const { data: employees = [] } = useQuery<EmployeeRef[]>({
    queryKey: ['employees'],
    queryFn: () => listEmployees(),
  })

  const { data: current } = useQuery({
    queryKey: ['formation', numericId],
    queryFn: () => (numericId ? getFormation(numericId) : Promise.resolve(null)),
    enabled: !!numericId,
  })

  const createMut = useMutation({
    mutationFn: (p: CreateFormationPayload) => createFormation(p),
    onSuccess: () => {
      toast.success('Formation created')
      queryClient.invalidateQueries({ queryKey: ['formations'] })
      navigate('/dashboard/formations')
    },
    onError: () => toast.error('Failed to create formation'),
  })

  const updateMut = useMutation({
    mutationFn: (p: Partial<CreateFormationPayload>) => updateFormation(numericId!, p),
    onSuccess: () => {
      toast.success('Formation updated')
      queryClient.invalidateQueries({ queryKey: ['formations'] })
      queryClient.invalidateQueries({ queryKey: ['formation', numericId] })
      navigate('/dashboard/formations')
    },
    onError: () => toast.error('Failed to update formation'),
  })

  React.useEffect(() => {
    if (current) {
      setPayload({
        name: current.name,
        description: current.description ?? '',
        location: current.location ?? '',
        date_deb: current.date_deb ? new Date(current.date_deb).toISOString().slice(0, 10) : '',
        duration_days: current.duration_days,
        instructor_id: current.instructor?.id_emp ?? 0,
      })
    }
  }, [current])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!payload.instructor_id) {
      toast.error('Instructor is required')
      return
    }
    if (!payload.date_deb) {
      toast.error('Start date is required')
      return
    }
    if (numericId) {
      await updateMut.mutateAsync(payload)
      return
    }
    await createMut.mutateAsync(payload)
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <div className="max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">{numericId ? 'Edit formation' : 'New formation'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Formation details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              value={payload.name}
              onChange={(e) => setPayload((s) => ({ ...s, name: e.target.value }))}
              placeholder="Formation name"
              required
            />
            <Input
              value={payload.location}
              onChange={(e) => setPayload((s) => ({ ...s, location: e.target.value }))}
              placeholder="Location"
            />
            <Input
              type="date"
              value={payload.date_deb}
              onChange={(e) => setPayload((s) => ({ ...s, date_deb: e.target.value }))}
              required
            />
            <Input
              type="number"
              min={1}
              value={payload.duration_days}
              onChange={(e) => setPayload((s) => ({ ...s, duration_days: Number(e.target.value || 1) }))}
              placeholder="Duration in days"
              required
            />
            <Select
              value={payload.instructor_id ? String(payload.instructor_id) : '0'}
              onValueChange={(v) => setPayload((s) => ({ ...s, instructor_id: Number(v) }))}
            >
              <SelectTrigger className="md:col-span-2">
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Select instructor</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id_emp} value={String(employee.id_emp)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <textarea
              value={payload.description}
              onChange={(e) => setPayload((s) => ({ ...s, description: e.target.value }))}
              placeholder="Description"
              className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:col-span-2"
            />

            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save formation'}</Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
