import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, MapPin, Trash2, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'

import { departmentService } from './department.service'

interface EmployeeRef {
  id_emp: number
  name: string
}

function currency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function DepartmentDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: department, isLoading } = useQuery({
    queryKey: ['department', numericId],
    queryFn: () => departmentService.getDepartment(numericId),
    enabled: !!numericId,
  })

  const { data: employees = [] } = useQuery<EmployeeRef[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  const deleteMut = useMutation({
    mutationFn: (departmentId: number) => departmentService.deleteDepartment(departmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      navigate('/dashboard/departments')
    },
  })

  const assignMut = useMutation({
    mutationFn: ({ managerId, managerName }: { managerId: number | null; managerName: string }) =>
      departmentService.assignManager(numericId, managerId, managerName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['department', numericId] }),
  })

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!department) return <div className="p-6">Department not found</div>

  const assignedEmployee = employees.find((employee) => employee.name === department.managerName)

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Building2 className="size-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Department detail</span>
          </div>
          <h1 className="text-2xl font-bold">{department.name}</h1>
          <p className="text-sm text-muted-foreground">{department.code} · {department.location}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/departments/${department.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="destructive" onClick={() => deleteMut.mutate(department.id)}>
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Department metadata, leadership, and operating metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Manager</p>
                <p className="text-lg font-semibold">{department.managerName}</p>
                <p className="text-sm text-muted-foreground">{assignedEmployee ? `Employee ID ${assignedEmployee.id_emp}` : 'No manager assigned'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={department.status === 'active' ? 'default' : 'outline'}>{department.status}</Badge>
              </div>
            </div>
            <Separator />
            <p className="text-sm leading-6 text-muted-foreground">{department.description}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                <p className="mt-1 text-xl font-semibold">{currency(department.budget)}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Headcount target</p>
                <p className="mt-1 text-xl font-semibold">{department.headcountTarget}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Location</p>
                <p className="mt-1 text-xl font-semibold">{department.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Manager assignment</CardTitle>
            <CardDescription>Reassign department ownership to an employee.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                <span className="text-sm">Current manager</span>
              </div>
              <p className="mt-2 font-medium">{department.managerName}</p>
            </div>
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                <span className="text-sm">Assignment options</span>
              </div>
              <div className="mt-3 space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => assignMut.mutate({ managerId: null, managerName: 'Unassigned' })}>
                  Clear manager
                </Button>
                {employees.map((employee) => (
                  <Button
                    key={employee.id_emp}
                    variant={department.managerName === employee.name ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => assignMut.mutate({ managerId: employee.id_emp, managerName: employee.name })}
                  >
                    {employee.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
