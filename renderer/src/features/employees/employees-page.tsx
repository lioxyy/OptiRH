import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { OrgChart } from './org-chart'
import { EmployeeForm } from './employee-form'

interface Employee {
  id_emp: number
  name: string
  email: string
  role: string
  id_dept: number
  department: { name: string }
  supervisor?: { name: string } | null
}

const roleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  Admin: 'default',
  Agent: 'secondary',
  Employee: 'outline',
}

export function EmployeesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'list' | 'orgchart'>('list')
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <Button variant={tab === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setTab('list')}>List</Button>
            {user?.role === 'Admin' && (
              <Button variant={tab === 'orgchart' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setTab('orgchart')}>Org Chart</Button>
            )}
          </div>
          {user?.role === 'Admin' && tab === 'list' && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>Add Employee</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Add Employee</DialogTitle>
                </DialogHeader>
                <EmployeeForm onSuccess={() => setIsAddOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {tab === 'orgchart' ? (
        <Card>
          <CardHeader>
            <CardTitle>Organization Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <OrgChart />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Supervisor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id_emp}>
                    <TableCell>
                      <Link to={`/dashboard/employees/${emp.id_emp}`} className="hover:underline font-medium">
                        {emp.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[emp.role] ?? 'outline'}>{emp.role}</Badge>
                    </TableCell>
                    <TableCell>{emp.department?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{emp.supervisor?.name ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
