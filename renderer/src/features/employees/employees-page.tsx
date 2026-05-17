import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
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

  const columns: ColumnDef<Employee>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <Link to={`/dashboard/employees/${row.original.id_emp}`} className="hover:underline font-medium">
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      id: "role",
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => <Badge variant={roleVariant[row.original.role] ?? 'outline'}>{row.original.role}</Badge>,
    },
    {
      id: "department",
      accessorFn: (row) => row.department?.name ?? 'General',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    },
    {
      id: "supervisor",
      accessorFn: (row) => row.supervisor?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Supervisor" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.supervisor?.name ?? '—'}</span>,
    },
  ]

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
        <GenericDataTable
          columns={columns}
          data={employees}
          searchOptions={[
            { id: "name", label: "Name" },
            { id: "email", label: "Email" },
            { id: "role", label: "Role" },
            { id: "department", label: "Department" }
          ]}
        />
      )}
    </div>
  )
}
