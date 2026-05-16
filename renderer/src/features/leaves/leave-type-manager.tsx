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
import { Plus } from 'lucide-react'

interface LeaveType {
  id_type: number
  name: string
  default_days: number
  is_cumulative: boolean
}

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  default_days: z.coerce.number().int().nonnegative('Doit être ≥ 0'),
  is_cumulative: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

export function LeaveTypeManager() {
  const [open, setOpen] = useState(false)
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

  const create = useMutation({
    mutationFn: (data: FormData) => api.post('/api/leaves/types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'types'] })
      toast.success('Type de congé créé')
      form.reset()
      setOpen(false)
    },
    onError: (err: any) => {
      console.error("Leave type error:", err.response?.data || err.message)
      const code = err?.response?.data?.code
      if (code === 'CONFLICT') {
        toast.error('Ce type de congé existe déjà')
      } else {
        toast.error('Échec de la création : ' + (err?.response?.data?.message || err.message))
      }
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Types de congé</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un type
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : types.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucun type de congé configuré.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Jours par défaut</TableHead>
                <TableHead>Cumulable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((t) => (
                <TableRow key={t.id_type}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.default_days} j</TableCell>
                  <TableCell>
                    <span className={t.is_cumulative ? 'text-primary' : 'text-muted-foreground'}>
                      {t.is_cumulative ? '✓ Oui' : '— Non'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialog ajout */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau type de congé</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex. Congé annuel" {...field} />
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
                    <FormLabel>Jours alloués par défaut</FormLabel>
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
                      Cumulable (report d'une année à l'autre)
                    </FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset() }}>
                  Annuler
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Création...' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
