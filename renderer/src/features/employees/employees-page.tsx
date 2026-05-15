import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Link } from 'react-router-dom'

interface Employee {
  id_emp: number
  name: string
  email: string
  role: string
  id_dept: number
  department: { name: string }
  supervisor?: { name: string } | null
}

export function EmployeesPage() {
  const { user } = useAuth()

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
        {user?.role === 'Admin' && (
          <Link
            to="/dashboard/employees/new"
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
          >
            Add Employee
          </Link>
        )}
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">Department</th>
              <th className="text-left px-4 py-2">Supervisor</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id_emp} className="border-t">
                <td className="px-4 py-2">
                  <Link to={`/dashboard/employees/${emp.id_emp}`} className="hover:underline">
                    {emp.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{emp.email}</td>
                <td className="px-4 py-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{emp.role}</span>
                </td>
                <td className="px-4 py-2">{emp.department?.name}</td>
                <td className="px-4 py-2">{emp.supervisor?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
