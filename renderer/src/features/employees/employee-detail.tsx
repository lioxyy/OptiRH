import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useParams } from 'react-router-dom'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export function EmployeeDetail() {
  const { id } = useParams()

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await api.get(`/api/employees/${id}`)
      return res.data.data
    },
  })

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!employee) return <div className="p-6">Employee not found</div>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{employee.name}</h1>
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
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Employment date</dt>
              <dd className="text-sm">{employee.date_employment?.split('T')[0]}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
