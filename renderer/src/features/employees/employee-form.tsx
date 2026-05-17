import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

import { toast } from 'sonner'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  role: z.enum(['Admin', 'Agent', 'Employee']),
  id_dept: z.coerce.number({ invalid_type_error: 'Department is required' }),
  supervisor_id: z.coerce.number().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

export function EmployeeForm({ onSuccess }: { onSuccess?: () => void }) {
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

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { role: 'Employee' },
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      await api.post('/api/employees', data)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee created')
      onSuccess?.()
    } catch {
      toast.error('Failed to create employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1 555-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id_dept"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id_dept} value={d.id_dept.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="supervisor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supervisor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allEmployees.map((e) => (
                    <SelectItem key={e.id_emp} value={e.id_emp.toString()}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Creating...' : 'Create Employee'}
        </Button>
      </form>
    </Form>
  )
}
