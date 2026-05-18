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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { User, KeyRound, ArrowRight, Briefcase } from 'lucide-react'

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Gender is required' }),
  date_birth: z.string().min(1, 'Date of birth is required'),
  date_employment: z.string().min(1, 'Date of employment is required'),
  address: z.string().optional(),
  role: z.enum(['Admin', 'Agent', 'Employee']),
  id_depts: z.array(z.number()).min(1, 'At least one department is required'),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
}).superRefine((data, ctx) => {
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
  manager_id: number | null
}

interface Employee {
  id_emp: number
  name: string
  role: string
  departments?: { id_dept: number }[]
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
  const [activeTab, setActiveTab] = useState('personal')

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/api/departments')
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
        id_depts: initialData.departments?.map((d: any) => d.id_dept) || [],
        password: '',
        confirm_password: '',
      }
      : { role: 'Employee', id_depts: [], password: '', confirm_password: '' },
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      if (data.role === 'Agent') {
        const deptWithAgent = departments.find(d => 
          data.id_depts.includes(d.id_dept) && 
          allEmployees.some(emp => 
            emp.role === 'Agent' && 
            emp.departments?.some((ed: any) => ed.id_dept === d.id_dept) &&
            emp.id_emp !== initialData?.id_emp
          )
        )
        if (deptWithAgent) {
          toast.error(`Department "${deptWithAgent.name}" already has an agent assigned`)
          setSubmitting(false)
          return
        }
      }

      const payload: any = {
        ...data,
        date_birth: new Date(data.date_birth).toISOString(),
        date_employment: new Date(data.date_employment).toISOString(),
      }

      delete payload.confirm_password
      if (initialData && !data.password) {
        delete payload.password
      } else if (!data.password && !initialData) {
        toast.error('Password is required for new employees')
        setSubmitting(false)
        return
      }

      if (initialData?.id_emp) {
        await api.patch(`/api/employees/${initialData.id_emp}`, payload)
        toast.success('Employee updated successfully')
      } else {
        await api.post('/api/employees', payload)
        toast.success('Employee created successfully')
      }

      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['employee', initialData?.id_emp?.toString()] })
      onSuccess?.()
    } catch (error: any) {
      const errMsg = error.response?.data?.message || (initialData ? 'Failed to update employee' : 'Failed to create employee')
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleContinueToJob = async () => {
    const fieldsToValidate: (keyof FormData)[] = [
      'name', 'gender', 'date_birth', 'date_employment'
    ]
    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setActiveTab('job')
    }
  }

  const handleContinueToAccount = async () => {
    const fieldsToValidate: (keyof FormData)[] = [
      'role', 'id_depts'
    ]
    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setActiveTab('account')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <User className="mr-2 h-4 w-4" /> Personal
            </TabsTrigger>
            <TabsTrigger value="job">
              <Briefcase className="mr-2 h-4 w-4" /> Job Details
            </TabsTrigger>
            <TabsTrigger value="account">
              <KeyRound className="mr-2 h-4 w-4" /> Credentials
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
          </TabsContent>

          <TabsContent value="job" className="space-y-4 pt-4">
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
              name="id_depts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Assigned Departments</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3 mt-1.5 border rounded-lg p-4 bg-muted/20 border-border">
                      {departments.map((d) => {
                        const checked = field.value?.includes(d.id_dept)
                        return (
                          <label
                            key={d.id_dept}
                            className={`flex items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-accent/40 cursor-pointer transition-all duration-150 ${
                              checked
                                ? "border-primary bg-primary/5 text-primary font-medium"
                                : "border-muted text-muted-foreground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                              onChange={(e) => {
                                const val = field.value || []
                                if (e.target.checked) {
                                  field.onChange([...val, d.id_dept])
                                } else {
                                  field.onChange(val.filter((id) => id !== d.id_dept))
                                }
                              }}
                            />
                            <span className="text-sm">{d.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('role') === 'Agent' && initialData && (
              <div className="space-y-2 border rounded-md p-4 bg-muted/40 border-border">
                <label className="text-xs font-semibold uppercase text-muted-foreground block">
                  Managed Departments
                </label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(() => {
                    const managed = departments.filter((d: any) => d.manager_id === initialData?.id_emp)
                    if (managed.length > 0) {
                      return managed.map((d: any) => (
                        <span
                          key={d.id_dept}
                          className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary"
                        >
                          {d.name}
                        </span>
                      ))
                    }
                    return (
                      <span className="text-xs text-muted-foreground italic">
                        None (No departments currently managed by this agent)
                      </span>
                    )
                  })()}
                </div>
              </div>
            )}
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
              <p className="text-[10px] text-muted-foreground italic pl-1">
                * Must be 8+ characters, include 1 number and 1 uppercase letter.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {activeTab === 'personal' && (
          <Button type="button" onClick={handleContinueToJob} className="w-full">
            Continue to Job Details <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {activeTab === 'job' && (
          <Button type="button" onClick={handleContinueToAccount} className="w-full">
            Continue to Credentials <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {activeTab === 'account' && (
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Employee' : 'Create Employee')}
          </Button>
        )}
      </form>
    </Form>
  )
}
