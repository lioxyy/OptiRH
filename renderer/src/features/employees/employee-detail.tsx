import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useParams, useNavigate } from 'react-router-dom'
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
import { EmployeeForm } from './employee-form'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

export function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await api.get(`/api/employees/${id}`)
      return res.data.data
    },
  })

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this employee?')) return
    try {
      await api.delete(`/api/employees/${id}`)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted')
      navigate('/dashboard/employees')
    } catch {
      toast.error('Failed to delete employee')
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!employee) return <div className="p-6">Employee not found</div>

  const isAdmin = user?.role === 'Admin'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{employee.name}</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Employee</DialogTitle>
                </DialogHeader>
                <EmployeeForm
                  initialData={employee}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="text-sm">{employee.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Role</dt>
                <dd><Badge variant={employee.role === 'Admin' ? 'default' : 'secondary'}>{employee.role}</Badge></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="text-sm">{employee.phone ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Gender</dt>
                <dd className="text-sm">{employee.gender ? (employee.gender.charAt(0) + employee.gender.slice(1).toLowerCase()) : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Date of birth</dt>
                <dd className="text-sm">{employee.date_birth?.split('T')[0]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Address</dt>
                <dd className="text-sm">{employee.address ?? '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Employment date</dt>
                <dd className="text-sm">{employee.date_employment?.split('T')[0]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Dept ID</dt>
                <dd className="text-sm">{employee.id_dept}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Supervisor ID</dt>
                <dd className="text-sm">{employee.supervisor_id ?? 'None'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
