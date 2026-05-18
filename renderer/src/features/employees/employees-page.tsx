import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
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
import { ContractForm } from '../contracts/contract-form'
import { MoreHorizontal, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { toast } from 'sonner'

export interface Employee {
  id_emp: number
  name: string
  email: string
  role: string
  date_employment: string
  departments?: { id_dept: number; name?: string }[]
  supervisor?: { name: string } | null
}

const roleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  Admin: 'default',
  Agent: 'secondary',
  Employee: 'outline',
}

export function EmployeesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'list' | 'orgchart'>('list')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // Mandatory Contract Workflow State
  const [isContractOpen, setIsContractOpen] = useState(false)
  const [newlyCreatedEmployee, setNewlyCreatedEmployee] = useState<Employee | null>(null)

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    try {
      await api.delete(`/api/employees/${id}`)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted')
    } catch {
      toast.error('Failed to delete employee')
    }
  }

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
      accessorFn: (row) => row.departments?.map(d => d.name).join(', ') || '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    },
    {
      id: "supervisor",
      accessorFn: (row) => row.supervisor?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Supervisor" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.supervisor?.name ?? '—'}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original
        if (user?.role !== 'Admin') return null

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setEditingEmployee(employee)
                setIsEditOpen(true)
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(employee.id_emp)} className="text-destructive font-medium">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Employees</h1>
          {user?.role === 'Admin' && tab === 'list' && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>Add Employee</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Add Employee</DialogTitle>
                </DialogHeader>
                <EmployeeForm
                  onSuccess={(emp) => {
                    setIsAddOpen(false)
                    setNewlyCreatedEmployee(emp)
                    setIsContractOpen(true)
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Mandatory Contract Dialog */}
        <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
          <DialogContent
            className="max-w-md"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Initialize Contract
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">
                New employee created. A contract is mandatory to enable payroll and system access.
              </p>
            </DialogHeader>
            {newlyCreatedEmployee && (
              <ContractForm
                initialEmployeeId={newlyCreatedEmployee.id_emp}
                initialStartDate={newlyCreatedEmployee.date_employment}
                onClose={() => {
                  setIsContractOpen(false)
                  setNewlyCreatedEmployee(null)
                }}
              />
            )}
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button
                variant="link"
                className="text-[10px] text-muted-foreground hover:text-foreground h-auto p-0"
                onClick={() => {
                  if (confirm("Warning: Access and payroll will be disabled for this employee until a contract is added. Continue?")) {
                    setIsContractOpen(false)
                    setNewlyCreatedEmployee(null)
                  }
                }}
              >
                Skip for now (not recommended)
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {user?.role !== 'Employee' && (
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'list' | 'orgchart')} className="w-fit">
            <TabsList className="h-9">
              <TabsTrigger value="list" className="h-7 px-4">List</TabsTrigger>
              <TabsTrigger value="orgchart" className="h-7 px-4">Org Chart</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <EmployeeForm
              initialData={editingEmployee}
              onSuccess={() => {
                setIsEditOpen(false)
                setEditingEmployee(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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
            { id: "department", label: "Department" },
            { id: "supervisor", label: "Supervisor" }
          ]}
        />
      )}
    </div>
  )
}
