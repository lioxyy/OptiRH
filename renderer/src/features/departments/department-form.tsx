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
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  manager_id: z.coerce.number().optional().nullable(),
})

type FormData = z.infer<typeof FormSchema>

interface Employee {
  id_emp: number
  name: string
  role: string
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

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  // Filter for potential managers (Admin or Agent roles)
  const potentialManagers = employees.filter(
    (e) => e.role === 'Admin' || e.role === 'Agent'
  )

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description ?? '',
          manager_id: initialData.manager_id,
        }
      : { name: '', description: '', manager_id: null },
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        manager_id: data.manager_id ? Number(data.manager_id) : null,
      }

      if (initialData?.id_dept) {
        await api.patch(`/api/departments/${initialData.id_dept}`, payload)
        toast.success('Department updated successfully')
      } else {
        await api.post('/api/departments', payload)
        toast.success('Department created successfully')
      }

      queryClient.invalidateQueries({ queryKey: ['departments'] })
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
                onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                defaultValue={field.value?.toString() ?? 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Saving...' : initialData ? 'Update Department' : 'Create Department'}
        </Button>
      </form>
    </Form>
  )
}
