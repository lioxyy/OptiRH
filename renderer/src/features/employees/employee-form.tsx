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
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Gender is required' }),
  date_birth: z.string().min(1, 'Date of birth is required'),
  date_employment: z.string().min(1, 'Date of employment is required'),
  address: z.string().optional(),
  role: z.enum(['Admin', 'Agent', 'Employee']),
  id_dept: z.coerce.number({ invalid_type_error: 'Department is required' }),
  supervisor_id: z.coerce.number().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).superRefine((data, ctx) => {
  const birthDate = new Date(data.date_birth)
  const employmentDate = new Date(data.date_employment)
  const today = new Date()

  // 1. Employee must be at least 18
  const age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  const is18 = age > 18 || (age === 18 && (m > 0 || (m === 0 && today.getDate() >= birthDate.getDate())))

  if (!is18) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Employee must be at least 18 years old",
      path: ["date_birth"],
    })
  }

  // 2. Date of employment <= today's date
  if (employmentDate > today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Employment date cannot be in the future",
      path: ["date_employment"],
    })
  }

  // 3. Employee can't have a date of employment where his age is < 18
  const ageAtEmp = employmentDate.getFullYear() - birthDate.getFullYear()
  const mAtEmp = employmentDate.getMonth() - birthDate.getMonth()
  const is18AtEmp = ageAtEmp > 18 || (ageAtEmp === 18 && (mAtEmp > 0 || (mAtEmp === 0 && employmentDate.getDate() >= birthDate.getDate())))

  if (!is18AtEmp) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Employee must have been at least 18 at the time of employment",
      path: ["date_employment"],
    })
  }
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
      // Convert date strings to ISO-8601 for backend Zod validation
      const payload = {
        ...data,
        date_birth: new Date(data.date_birth).toISOString(),
        date_employment: new Date(data.date_employment).toISOString(),
      }

      await api.post('/api/employees', payload)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee created successfully')
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date_employment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
