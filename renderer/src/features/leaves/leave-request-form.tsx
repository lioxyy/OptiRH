import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Plus } from 'lucide-react'

interface LeaveType {
  id_type: number
  name: string
}

interface Balance {
  id_type: number
  allocated: number
  consumed: number
  carried_over: number
}

const schema = z
  .object({
    id_type: z.coerce.number().int().positive('Sélectionnez un type'),
    date_deb: z.string().min(1, 'Date de début requise'),
    date_fin: z.string().min(1, 'Date de fin requise'),
  })
  .refine((d) => new Date(d.date_fin) >= new Date(d.date_deb), {
    message: 'La date de fin doit être après la date de début',
    path: ['date_fin'],
  })

type FormData = z.infer<typeof schema>

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (e < s) return 0
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export function LeaveRequestForm() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const year = new Date().getFullYear()

  const { data: leaveTypes = [] } = useQuery<LeaveType[]>({
    queryKey: ['leaves', 'types'],
    queryFn: async () => {
      const res = await api.get('/api/leaves/types')
      return res.data.data
    },
  })

  const { data: balances = [] } = useQuery<Balance[]>({
    queryKey: ['leaves', 'balances', year],
    queryFn: async () => {
      const res = await api.get(`/api/leaves/balances/${year}`)
      return res.data.data
    },
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date_deb: '', date_fin: '' },
  })

  const watchedType = form.watch('id_type')
  const watchedStart = form.watch('date_deb')
  const watchedEnd = form.watch('date_fin')

  const days = calcDays(watchedStart, watchedEnd)

  const selectedBalance = balances.find((b) => b.id_type === Number(watchedType))
  const remaining = selectedBalance
    ? selectedBalance.allocated + selectedBalance.carried_over - selectedBalance.consumed
    : null

  const submit = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/api/leaves/requests', {
        id_type: data.id_type,
        date_deb: new Date(data.date_deb).toISOString(),
        date_fin: new Date(data.date_fin).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Demande envoyée avec succès')
      form.reset()
      setOpen(false)
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error
      if (code === 'INSUFFICIENT_BALANCE') {
        toast.error('Solde insuffisant pour cette demande')
      } else if (code === 'INVALID_DATES') {
        toast.error('Dates invalides')
      } else {
        toast.error('Échec de la demande')
      }
    },
  })

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Nouvelle demande
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle demande de congé</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => submit.mutate(d))} className="space-y-4">
              <FormField
                control={form.control}
                name="id_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de congé</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((t) => (
                          <SelectItem key={t.id_type} value={t.id_type.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="date_deb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Info calculée */}
              {days > 0 && (
                <div className="rounded-md border bg-muted/40 px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée calculée</span>
                    <span className="font-semibold">{days} jour{days > 1 ? 's' : ''}</span>
                  </div>
                  {remaining !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Solde disponible</span>
                      <span className={`font-semibold ${remaining < days ? 'text-destructive' : 'text-primary'}`}>
                        {remaining} jour{remaining > 1 ? 's' : ''}
                        {remaining < days && ' ⚠ insuffisant'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset() }}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submit.isPending}>
                  {submit.isPending ? 'Envoi...' : 'Soumettre'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
