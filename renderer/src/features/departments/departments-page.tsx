import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { DepartmentForm } from './department-form'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Department {
  id_dept: number
  name: string
  description: string | null
  manager?: { name: string } | null
  _count?: { employees: number }
}

export function DepartmentsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/api/departments')
      return res.data.data
    },
  })

  const handleDelete = async (dept: Department) => {
    if (dept._count && dept._count.employees > 0) {
      toast.error('Cannot delete a department that contains active employees. Reassign employees first.')
      return
    }
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      await api.delete(`/api/departments/${dept.id_dept}`)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department deleted successfully')
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to delete department'
      toast.error(errMsg)
    }
  }

  if (isLoading) return <div className="p-6 text-center">Loading departments...</div>

  const columns: ColumnDef<Department>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department Name" />,
      cell: ({ row }) => (
        <Link to={`/dashboard/departments/${row.original.id_dept}`} className="hover:underline font-semibold text-primary">
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "description",
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => <span className="text-muted-foreground text-xs line-clamp-1">{row.original.description ?? '—'}</span>,
    },
    {
      id: "manager",
      accessorFn: (row) => row.manager?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Manager" />,
      cell: ({ row }) => <span className="text-muted-foreground font-medium">{row.original.manager?.name ?? '—'}</span>,
    },
    {
      id: "employeesCount",
      accessorFn: (row) => row._count?.employees ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Staff Count" />,
      cell: ({ row }) => <span className="font-semibold">{row.original._count?.employees ?? 0}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const dept = row.original
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
                setEditingDepartment(dept)
                setIsEditOpen(true)
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(dept)} className="text-destructive font-medium">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Departments</h1>
        {user?.role === 'Admin' && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>Add Department</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Department</DialogTitle>
              </DialogHeader>
              <DepartmentForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          {editingDepartment && (
            <DepartmentForm
              initialData={editingDepartment}
              onSuccess={() => {
                setIsEditOpen(false)
                setEditingDepartment(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <GenericDataTable
        columns={columns}
        data={departments}
        searchOptions={[
          { id: "name", label: "Department Name" },
          { id: "description", label: "Description" },
          { id: "manager", label: "Manager" }
        ]}
      />
    </div>
  )
}
