import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { useAuth } from '../../context/auth-context'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { DepartmentForm } from './department-form'
import { useState } from 'react'
import { Pencil, Trash2, Users, Shield, ArrowLeft } from 'lucide-react'

interface Employee {
  id_emp: number
  name: string
  email: string
  role: string
}

interface Department {
  id_dept: number
  name: string
  description: string | null
  manager_id: number | null
  manager: Employee | null
  employees: Employee[]
}

export function DepartmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: department, isLoading } = useQuery<Department>({
    queryKey: ['department', id],
    queryFn: async () => {
      const res = await api.get(`/api/departments/${id}`)
      return res.data.data
    },
  })

  async function handleDelete() {
    if (!department) return
    if (department.employees && department.employees.length > 0) {
      toast.error('Cannot delete a department that contains employees. Reassign employees first.')
      return
    }
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      await api.delete(`/api/departments/${id}`)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Department deleted successfully')
      navigate('/dashboard/departments')
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to delete department'
      toast.error(errMsg)
    }
  }

  if (isLoading) return <div className="p-6 text-center">Loading department details...</div>
  if (!department) return <div className="p-6 text-center text-destructive">Department not found</div>

  const isAdmin = user?.role === 'Admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/departments')} className="p-2 h-auto">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{department.name}</h1>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Department</DialogTitle>
                </DialogHeader>
                <DepartmentForm
                  initialData={department}
                  onSuccess={() => setIsEditDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Department Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Description</span>
              <p className="text-sm">{department.description ?? 'No description provided.'}</p>
            </div>
            <div className="pt-2 border-t">
              <span className="text-xs text-muted-foreground block mb-2">Manager</span>
              {department.manager ? (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                    {department.manager.name.charAt(0)}
                  </div>
                  <div>
                    <Link
                      to={`/dashboard/employees/${department.manager.id_emp}`}
                      className="text-sm font-medium hover:underline text-primary"
                    >
                      {department.manager.name}
                    </Link>
                    <span className="text-[11px] text-muted-foreground block">{department.manager.email}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-amber-500" />
                  No manager assigned
                </div>
              )}
            </div>
            <div className="pt-2 border-t flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Staff</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {department.employees?.length ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assigned Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {department.employees && department.employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {department.employees.map((emp) => (
                      <tr key={emp.id_emp} className="hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 font-medium">
                          <Link to={`/dashboard/employees/${emp.id_emp}`} className="hover:underline text-primary">
                            {emp.name}
                          </Link>
                        </td>
                        <td className="py-2.5 text-muted-foreground">{emp.email}</td>
                        <td className="py-2.5">
                          <Badge variant={emp.role === 'Admin' ? 'default' : emp.role === 'Agent' ? 'secondary' : 'outline'}>
                            {emp.role}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground italic">
                No employees are assigned to this department yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
