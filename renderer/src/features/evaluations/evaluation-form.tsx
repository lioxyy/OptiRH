import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../../components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Button } from '../../components/ui/button'
import { Calculator, Target } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../components/ui/dialog'

const EvaluationSchema = z.object({
  type_eval: z.enum(['Employee', 'Candidate']),
  evaluatee_id: z.number({ required_error: 'Please select an individual' }),
  campaign_id: z.number({ required_error: 'Please select a campaign' }),
  bonus_amount: z.number().min(0).default(0),
  comments: z.string().optional(),
  scores: z.array(z.object({
    criteria_id: z.number(),
    score: z.number().min(0),
    comment: z.string().optional(),
  })).min(1, 'At least one criteria is required'),
})

type EvaluationFormValues = z.infer<typeof EvaluationSchema>

interface EvaluationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EvaluationForm({ open, onOpenChange }: EvaluationFormProps) {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState<'Employee' | 'Candidate'>('Employee')

  // Fetch Data
  const { data: employees = [] } = useQuery<any[]>({ queryKey: ['employees'], queryFn: async () => (await api.get('/api/employees')).data.data })
  const { data: candidates = [] } = useQuery<any[]>({ queryKey: ['candidates'], queryFn: async () => (await api.get('/api/recruitment')).data.data })
  const { data: campaigns = [] } = useQuery<any[]>({ queryKey: ['campaigns'], queryFn: async () => (await api.get('/api/evaluations/campaigns')).data.data })
  const { data: criteria = [] } = useQuery<any[]>({
    queryKey: ['criteria'],
    queryFn: async () => (await api.get('/api/evaluations/criteria')).data.data,
  })

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(EvaluationSchema),
    defaultValues: {
      type_eval: 'Employee',
      bonus_amount: 0,
      scores: [],
    }
  })

  // Pre-populate scores when criteria are loaded and form is empty
  useEffect(() => {
    if (criteria.length > 0 && form.getValues('scores').length === 0) {
      form.setValue('scores', criteria.map((c: any) => ({
        criteria_id: c.id_criteria,
        score: 0,
        comment: '',
      })))
    }
  }, [criteria, form])

  const { fields } = useFieldArray({
    control: form.control,
    name: "scores"
  })

  const mutation = useMutation({
    mutationFn: (values: EvaluationFormValues) => {
      const payload = {
        ...values,
        evaluatee_emp_id: values.type_eval === 'Employee' ? values.evaluatee_id : undefined,
        evaluatee_cand_id: values.type_eval === 'Candidate' ? values.evaluatee_id : undefined,
      }
      return api.post('/api/evaluations', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      queryClient.invalidateQueries({ queryKey: ['eval-stats'] })
      toast.success('Evaluation submitted successfully')
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit evaluation')
    }
  })

  const currentScores = form.watch('scores')

  const calculateLiveScore = () => {
    if (!criteria || criteria.length === 0 || currentScores.length === 0) return 0
    let totalWeighted = 0
    let totalWeight = 0
    currentScores.forEach(s => {
      const crit = criteria.find((c: any) => c.id_criteria === s.criteria_id)
      if (crit) {
        totalWeighted += (s.score / crit.max_score) * 100 * crit.weight
        totalWeight += crit.weight
      }
    })
    return totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Performance Evaluation
          </DialogTitle>
          <DialogDescription>Structured assessment with weighted performance metrics.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <div className="space-y-8">
              {/* SECTION: Selection */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border border-primary/5">
                <FormField
                  control={form.control}
                  name="type_eval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider font-semibold opacity-70">Assessment For</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val)
                          setSelectedType(val as any)
                          form.setValue('evaluatee_id', undefined as any)
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-primary/10">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Employee">Active Employee</SelectItem>
                          <SelectItem value="Candidate">Job Candidate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="evaluatee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider font-semibold opacity-70">
                        {selectedType === 'Employee' ? 'Select Employee' : 'Select Candidate'}
                      </FormLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-primary/10">
                            <SelectValue placeholder="Begin search..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(selectedType === 'Employee' ? employees : candidates).map((item: any) => (
                            <SelectItem key={item.id_emp ?? item.id_cand} value={(item.id_emp ?? item.id_cand).toString()}>
                              {item.name}
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
                  name="campaign_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs uppercase tracking-wider font-semibold opacity-70">Evaluation Campaign</FormLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-primary/10">
                            <SelectValue placeholder="Assign to campaign (e.g. Annual Review)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campaigns.map((c: any) => (
                            <SelectItem key={c.id_campaign} value={c.id_campaign.toString()}>
                              {c.title} ({c.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SECTION: Scoring */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold uppercase flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Performance Scoring
                  </h3>
                  <div className="text-[10px] font-bold text-primary">
                    Live Total: {calculateLiveScore()}/100
                  </div>
                </div>

                <div className="space-y-6">
                  {fields.map((field, index) => {
                    const crit = criteria.find((c: any) => c.id_criteria === field.criteria_id)
                    return (
                      <div key={field.id} className="grid grid-cols-1 gap-3 p-4 rounded-lg bg-card border transition-all group">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm">{crit?.name || 'Loading...'}</p>
                            <p className="text-xs text-muted-foreground">{crit?.description || 'No description provided.'}</p>
                          </div>
                          <div className="text-[10px] font-bold uppercase bg-muted px-2 py-0.5 rounded">Weight: {crit?.weight}x</div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="col-span-1 space-y-1">
                            <label className="text-[10px] uppercase font-bold opacity-50">Score (/{crit?.max_score})</label>
                            <Input
                              type="number"
                              min="0"
                              max={crit?.max_score}
                              className="h-9 font-mono"
                              {...form.register(`scores.${index}.score`, { valueAsNumber: true })}
                            />
                          </div>
                          <div className="col-span-3 space-y-1">
                            <label className="text-[10px] uppercase font-bold opacity-50">Optional Notes</label>
                            <Input
                              placeholder="Specific evidence or observations..."
                              className="h-9 text-sm"
                              {...form.register(`scores.${index}.comment`)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SECTION: General */}
              <div className="space-y-4 pt-4 border-t border-dashed">
                <div className="grid grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="bonus_amount"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-xs font-bold uppercase opacity-70">Merit Bonus (DA)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={e => field.onChange(Number(e.target.value))} className="bg-green-50/10 border-green-500/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormLabel className="text-xs font-bold uppercase opacity-70">Director's Summary Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="High-level feedback for the employee record..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Discard Change</Button>
              <Button type="submit" disabled={mutation.isPending} className="px-8 bg-primary">
                {mutation.isPending ? 'Finalizing...' : 'Commit Evaluation'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
