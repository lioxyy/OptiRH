import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useParams } from 'react-router-dom'

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
      <div className="space-y-3">
        <div><span className="text-sm text-muted-foreground">Email:</span> <span className="text-sm">{employee.email}</span></div>
        <div><span className="text-sm text-muted-foreground">Role:</span> <span className="text-sm">{employee.role}</span></div>
        <div><span className="text-sm text-muted-foreground">Phone:</span> <span className="text-sm">{employee.phone ?? '—'}</span></div>
        <div><span className="text-sm text-muted-foreground">Gender:</span> <span className="text-sm">{employee.gender ?? '—'}</span></div>
        <div><span className="text-sm text-muted-foreground">Date of birth:</span> <span className="text-sm">{employee.date_birth?.split('T')[0]}</span></div>
        <div><span className="text-sm text-muted-foreground">Address:</span> <span className="text-sm">{employee.address ?? '—'}</span></div>
        <div><span className="text-sm text-muted-foreground">Employment date:</span> <span className="text-sm">{employee.date_employment?.split('T')[0]}</span></div>
      </div>
    </div>
  )
}
