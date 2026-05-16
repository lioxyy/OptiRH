import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form'
import { Checkbox } from '../../components/ui/checkbox'
import { Skeleton } from '../../components/ui/skeleton'
import { Plus, Pencil } from 'lucide-react'

interface LeaveType {
  id_type: number
  name: string
  default_days: number
  is_cumulative: boolean
}

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  default_days: z.coerce.number().int().nonnegative('Must be >= 0'),
  is_cumulative: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

export function LeaveTypeManager() {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: types = [], isLoading } = useQuery<LeaveType[]>({
    queryKey: ['leaves', 'types'],
    queryFn: async () => {
      const res = await api.get('/api/leaves/types')
      return res.data.data
    },
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', default_days: 0, is_cumulative: false },
  })

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
    form.reset({ name: '', default_days: 0, is_cumulative: false })
  }

  const handleEdit = (t: LeaveType) => {
    setEditingId(t.id_type)
    form.reset({
      name: t.name,
      default_days: t.default_days,
      is_cumulative: t.is_cumulative,
    })
    setOpen(true)
  }

  const create = useMutation({
    mutationFn: (data: FormData) => api.post('/api/leaves/types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'types'] })
      toast.success('Leave type created')
      handleClose()
    },
    onError: (err: any) => {
      console.error("Leave type error:", err.response?.data || err.message)
      const code = err?.response?.data?.code
      if (code === 'CONFLICT') {
        toast.error('This leave type already exists')
      } else {
        toast.error('Creation failed: ' + (err?.response?.data?.message || err.message))
      }
    },
  })

  const update = useMutation({
    mutationFn: (data: FormData) => api.put(`/api/leaves/types/${editingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'types'] })
      toast.success('Leave type updated')
      handleClose()
    },
    onError: (err: any) => {
      toast.error('Update failed: ' + (err?.response?.data?.message || err.message))
    },
  })

  const onSubmit = (d: FormData) => {
    if (editingId) update.mutate(d)
    else create.mutate(d)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Leave Types</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add a type
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : types.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No leave types configured.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Default days</TableHead>
                <TableHead>Cumulative</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((t) => (
                <TableRow key={t.id_type}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.default_days} d</TableCell>
                  <TableCell>
                    <span className={t.is_cumulative ? 'text-primary' : 'text-muted-foreground'}>
                      {t.is_cumulative ? '✓ Yes' : '— No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(v) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit leave type' : 'New leave type'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Annual leave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default allocated days</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_cumulative"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      Cumulative (carries over to next year)
                    </FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending || update.isPending}>
                  {create.isPending || update.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
