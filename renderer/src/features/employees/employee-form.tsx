import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

import { toast } from 'sonner'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { User, KeyRound } from 'lucide-react'

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
  password: z.string().optional(),
  confirm_password: z.string().optional(),
}).superRefine((data, ctx) => {
  // Password validation logic:
  // If editing: password can be empty.
  // If creating: password is required (checked in onSubmit, but good to add hint here or use a flag)

  if (data.password) {
    if (data.password.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least 8 characters", path: ["password"] })
    }
    if (!/[0-9]/.test(data.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requires a number", path: ["password"] })
    }
    if (!/[A-Z]/.test(data.password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requires an uppercase letter", path: ["password"] })
    }
    if (data.password !== data.confirm_password) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirm_password"] })
    }
  }

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
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const empDateStart = new Date(employmentDate)
  empDateStart.setHours(0, 0, 0, 0)

  if (empDateStart > todayStart) {
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
  role: string
}

export function EmployeeForm({
  onSuccess,
  initialData,
}: {
  onSuccess?: () => void
  initialData?: any
}) {
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
    defaultValues: initialData
      ? {
        ...initialData,
        date_birth: initialData.date_birth?.split('T')[0],
        date_employment: initialData.date_employment?.split('T')[0],
        password: '',
        confirm_password: '',
      }
      : { role: 'Employee', password: '', confirm_password: '' },
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const payload: any = {
        ...data,
        date_birth: new Date(data.date_birth).toISOString(),
        date_employment: new Date(data.date_employment).toISOString(),
      }

      // Remove password/confirm_password if empty during edit
      if (initialData && !data.password) {
        delete payload.password
        delete payload.confirm_password
      } else if (!data.password && !initialData) {
        toast.error('Password is required for new employees')
        setSubmitting(false)
        return
      }

      if (initialData?.id_emp) {
        await api.put(`/api/employees/${initialData.id_emp}`, payload)
        toast.success('Employee updated successfully')
      } else {
        await api.post('/api/employees', payload)
        toast.success('Employee created successfully')
      }

      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', initialData?.id_emp?.toString()] })
      onSuccess?.()
    } catch {
      toast.error(initialData ? 'Failed to update employee' : 'Failed to create employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">
              <User className="mr-2 h-4 w-4" /> Personal Details
            </TabsTrigger>
            <TabsTrigger value="account">
              <KeyRound className="mr-2 h-4 w-4" /> Account Credentials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 pt-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="id_dept"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select dept" />
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
                        {allEmployees
                          .filter((e) => e.role === 'Admin' || e.role === 'Agent')
                          .map((e) => (
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
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-4 pt-4">
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

            <Card className="bg-muted/30 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password {initialData && "(optional)"}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  * Must be 8+ characters, include 1 number and 1 uppercase letter.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Employee' : 'Create Employee')}
        </Button>
      </form>
    </Form>
  )
}
