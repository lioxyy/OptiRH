import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

interface EvaluationFormProps {
  onClose: () => void
}

export function EvaluationForm({ onClose }: EvaluationFormProps) {
  const queryClient = useQueryClient()
  const [type, setType] = useState<'Employee' | 'Candidate'>('Employee')
  const [evaluateeId, setEvaluateeId] = useState<number | ''>('')
  const [score, setScore] = useState('70')
  const [bonus, setBonus] = useState('0')
  const [comments, setComments] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    }
  })

  const { data: candidates = [] } = useQuery({
    queryKey: ['recruitment'],
    queryFn: async () => {
      const res = await api.get('/api/recruitment')
      return res.data.data
    }
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/evaluations', {
        score: Number(score),
        bonus_amount: Number(bonus),
        comments: comments || undefined,
        type_eval: type,
        ...(type === 'Employee' ? { evaluatee_emp_id: Number(evaluateeId) } : { evaluatee_cand_id: Number(evaluateeId) }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create evaluation')
    }
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>New Evaluation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md font-medium">{error}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Evaluation Type</label>
            <select value={type} onChange={(e) => { setType(e.target.value as 'Employee' | 'Candidate'); setEvaluateeId('') }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="Employee">Employee</option>
              <option value="Candidate">Candidate</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{type === 'Employee' ? 'Employee' : 'Candidate'}</label>
            <select value={evaluateeId} onChange={(e) => setEvaluateeId(e.target.value ? Number(e.target.value) : '')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select...</option>
              {(type === 'Employee' ? employees : candidates).map((item: any) => (
                <option key={item.id_emp ?? item.id_cand} value={item.id_emp ?? item.id_cand}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Score (0-100)</label>
              <input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bonus (DA)</label>
              <input type="number" min="0" value={bonus} onChange={(e) => setBonus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comments</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" placeholder="Optional comments" />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !evaluateeId || !score}>
              {mutation.isPending ? 'Saving...' : 'Create Evaluation'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
