import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Filter, Search, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'

import { departmentService } from './department.service'
import type { Department } from './types'

interface EmployeeRef {
  id_emp: number
  name: string
}

function currency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function DepartmentListPage() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'archived'>('all')
  const [managerFilter, setManagerFilter] = React.useState<'all' | 'assigned' | 'unassigned'>('all')

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.listDepartments(),
  })

  const { data: employees = [] } = useQuery<EmployeeRef[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => departmentService.deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })

  const assignMut = useMutation({
    mutationFn: ({ id, managerId, managerName }: { id: number; managerId: number | null; managerName: string }) =>
      departmentService.assignManager(id, managerId, managerName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })

  const filteredDepartments = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return departments.filter((department) => {
      if (statusFilter !== 'all' && department.status !== statusFilter) return false
      if (managerFilter === 'assigned' && !department.managerId) return false
      if (managerFilter === 'unassigned' && department.managerId) return false
      if (!q) return true
      return (
        department.name.toLowerCase().includes(q) ||
        department.code.toLowerCase().includes(q) ||
        department.description.toLowerCase().includes(q) ||
        department.managerName.toLowerCase().includes(q)
      )
    })
  }, [departments, search, statusFilter, managerFilter])

  const stats = React.useMemo(() => {
    const active = departments.filter((department) => department.status === 'active')
    const assigned = departments.filter((department) => department.managerId !== null)
    const totalBudget = departments.reduce((sum, department) => sum + department.budget, 0)
    const totalHeadcount = departments.reduce((sum, department) => sum + department.headcountTarget, 0)
    return {
      total: departments.length,
      active: active.length,
      assigned: assigned.length,
      totalBudget,
      totalHeadcount,
    }
  }, [departments])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 pt-0">
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="gap-4 border-b pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="size-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Department management</span>
              </div>
              <CardTitle className="text-3xl">CRUD, manager assignment, and department statistics</CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Create and maintain departments, assign managers, and monitor active groups, budget, and headcount targets.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                <Building2 className="size-3.5" />
                {stats.total} departments
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-muted-foreground">
                {stats.assigned} assigned managers
              </Badge>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-4">
            <Card>
              <CardHeader>
                <CardDescription>Active departments</CardDescription>
                <CardTitle className="text-2xl">{stats.active}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Manager assignments</CardDescription>
                <CardTitle className="text-2xl">{stats.assigned}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total budget</CardDescription>
                <CardTitle className="text-2xl">{currency(stats.totalBudget)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Headcount target</CardDescription>
                <CardTitle className="text-2xl">{stats.totalHeadcount}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg">Department directory</CardTitle>
              <CardDescription>Filter by status or manager assignment, then edit, delete, or reassign managers.</CardDescription>
            </div>
            <Link to="/dashboard/departments/new">
              <Button size="sm">New department</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_repeat(2,180px)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search departments, code, manager" className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={managerFilter} onValueChange={(value) => setManagerFilter(value as typeof managerFilter)}>
              <SelectTrigger>
                <Filter className="mr-2 size-4 text-muted-foreground" />
                <SelectValue placeholder="Manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All managers</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((department) => (
                <DepartmentRow
                  key={department.id}
                  department={department}
                  employees={employees}
                  onAssign={(managerId, managerName) => assignMut.mutate({ id: department.id, managerId, managerName })}
                  onDelete={() => deleteMut.mutate(department.id)}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

type DepartmentRowProps = {
  department: Department
  employees: EmployeeRef[]
  onAssign: (managerId: number | null, managerName: string) => void
  onDelete: () => void
}

function DepartmentRow({ department, employees, onAssign, onDelete }: DepartmentRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Link to={`/dashboard/departments/${department.id}`} className="font-medium hover:underline">
          {department.name}
        </Link>
        <p className="text-sm text-muted-foreground">{department.code} · {department.location}</p>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <p className="text-sm font-medium">{department.managerName}</p>
          <Select
            value={department.managerId ? String(department.managerId) : 'none'}
            onValueChange={(value) => {
              if (value === 'none') {
                onAssign(null, 'Unassigned')
                return
              }
              const selected = employees.find((employee) => String(employee.id_emp) === value)
              onAssign(selected ? selected.id_emp : null, selected?.name ?? 'Unassigned')
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
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
        </div>
      </TableCell>
      <TableCell className="tabular-nums">{currency(department.budget)}</TableCell>
      <TableCell className="tabular-nums">{department.headcountTarget}</TableCell>
      <TableCell>
        <Badge variant={department.status === 'active' ? 'default' : 'outline'}>{department.status}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          <Link to={`/dashboard/departments/${department.id}`}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          <Link to={`/dashboard/departments/${department.id}/edit`}>
            <Button size="sm" variant="ghost">Edit</Button>
          </Link>
          <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
