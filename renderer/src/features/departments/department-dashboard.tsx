import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Building2, TrendingUp, Users } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { departmentService } from './department.service'

interface EmployeeRef {
  id_emp: number
  name: string
  id_dept?: number
}

function currency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function DepartmentDashboard() {
  const { data: departments = [] } = useQuery({
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

  const assignedDepartments = departments.filter((department) => department.managerId !== null)
  const totalBudget = departments.reduce((sum, department) => sum + department.budget, 0)
  const totalHeadcountTarget = departments.reduce((sum, department) => sum + department.headcountTarget, 0)
  const avgHeadcountTarget = departments.length ? Math.round(totalHeadcountTarget / departments.length) : 0
  const peopleCovered = employees.filter((employee) => employee.id_dept).length

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Total departments</CardDescription>
          <Building2 className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl">{departments.length}</CardTitle>
          <p className="text-sm text-muted-foreground">{assignedDepartments.length} assigned managers</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Assigned managers</CardDescription>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl">{assignedDepartments.length}</CardTitle>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Total budget</CardDescription>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl">{currency(totalBudget)}</CardTitle>
          <p className="text-sm text-muted-foreground">Avg target {avgHeadcountTarget}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Active coverage</CardDescription>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-2xl">{peopleCovered}</CardTitle>
          <p className="text-sm text-muted-foreground">Employees assigned to departments</p>
        </CardContent>
      </Card>
    </div>
  )
}
