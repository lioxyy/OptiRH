import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useState } from 'react'

const FormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['Admin', 'Agent', 'Employee']),
  id_dept: z.number(),
  supervisor_id: z.number().optional(),
  password: z.string().min(6).optional(),
})

type FormData = z.infer<typeof FormSchema>

interface Department {
  id_dept: number
  name: string
}

interface Employee {
  id_emp: number
  name: string
}

export function EmployeeForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/api/employees/departments')
      return res.data.data
    },
  })

  const { data: allEmployees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      await api.post('/api/employees', data)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee created')
      navigate('/dashboard/employees')
    } catch {
      toast.error('Failed to create employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Add Employee</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input {...register('name')} className="w-full border rounded px-3 py-2 text-sm" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register('email')} type="email" className="w-full border rounded px-3 py-2 text-sm" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input {...register('password')} type="password" className="w-full border rounded px-3 py-2 text-sm" />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select {...register('role')} className="w-full border rounded px-3 py-2 text-sm">
            <option value="Employee">Employee</option>
            <option value="Agent">Agent</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <select {...register('id_dept', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Select...</option>
            {departments.map((d) => (
              <option key={d.id_dept} value={d.id_dept}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Supervisor</label>
          <select {...register('supervisor_id', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 text-sm">
            <option value="">None</option>
            {allEmployees.map((e) => (
              <option key={e.id_emp} value={e.id_emp}>{e.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  )
}
