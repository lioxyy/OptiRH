import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs'

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  manager_id: z.coerce.number({ invalid_type_error: 'Manager is required' }).int().positive('Manager is required'),
  employee_ids: z.array(z.number()).default([]),
})

type FormData = z.infer<typeof FormSchema>

interface Employee {
  id_emp: number
  name: string
  role: string
  id_dept?: number
}

export function DepartmentForm({
  onSuccess,
  initialData,
}: {
  onSuccess?: () => void
  initialData?: any
}) {
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })


  // Filter for potential managers (Agent and Admin roles)
  const potentialManagers = employees.filter(
    (e) => e.role === 'Agent' || e.role === 'Admin'
  )

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      manager_id: initialData?.manager_id ?? undefined,
      employee_ids: [],
    },
  })

  // Sync loaded employees to form checkboxes when in edit mode
  useEffect(() => {
    if (employees.length > 0 && initialData?.id_dept) {
      const deptEmpIds = employees
        .filter((emp) => emp.id_dept === initialData.id_dept)
        .map((emp) => emp.id_emp)

      form.reset({
        name: initialData.name,
        description: initialData.description ?? '',
        manager_id: initialData.manager_id,
        employee_ids: deptEmpIds,
      })
    }
  }, [employees, initialData, form.reset])

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        manager_id: Number(data.manager_id),
        employee_ids: data.employee_ids.map(Number),
      }

      if (initialData?.id_dept) {
        await api.patch(`/api/departments/${initialData.id_dept}`, payload)
        toast.success('Department updated successfully')
      } else {
        await api.post('/api/departments', payload)
        toast.success('Department created successfully')
      }

      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      if (initialData?.id_dept) {
        queryClient.invalidateQueries({ queryKey: ['department', initialData.id_dept.toString()] })
      }
      onSuccess?.()
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'An error occurred'
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Engineering" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Describe the department's focus..."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val ? Number(val) : '')}
                    value={field.value?.toString() ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {potentialManagers.map((m) => (
                        <SelectItem key={m.id_emp} value={m.id_emp.toString()}>
                          {m.name} ({m.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Staff Members</label>
              <Input
                placeholder="Search employees to assign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-xs mb-2"
              />
              <div className="border rounded-md p-3 max-h-[220px] overflow-y-auto bg-card space-y-1.5">
                <FormField
                  control={form.control}
                  name="employee_ids"
                  render={({ field }) => {
                    const selectedIds = field.value || []
                    const toggleEmployee = (empId: number) => {
                      if (selectedIds.includes(empId)) {
                        field.onChange(selectedIds.filter((id) => id !== empId))
                      } else {
                        field.onChange([...selectedIds, empId])
                      }
                    }

                    return (
                      <>
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((emp) => {
                            const isChecked = selectedIds.includes(emp.id_emp)
                            return (
                              <div
                                key={emp.id_emp}
                                onClick={() => toggleEmployee(emp.id_emp)}
                                className={`flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-accent/40 transition-colors text-xs ${
                                  isChecked ? 'border-primary bg-primary/5 font-medium' : 'border-border'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span>{emp.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{emp.role}</span>
                                </div>
                                <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                                  isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                                }`}>
                                  {isChecked && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-center py-4 text-xs text-muted-foreground italic">No employees found</div>
                        )}
                      </>
                    )
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Saving...' : initialData ? 'Update Department' : 'Create Department'}
        </Button>
      </form>
    </Form>
  )
}
