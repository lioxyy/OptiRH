import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { EvaluationForm } from './evaluation-form'

interface Evaluation {
  id_eval: number
  score: number
  bonus_amount: number
  comments?: string | null
  type_eval: string
  date_eval: string
  evaluator?: { name: string }
  evaluatee_emp?: { name: string } | null
  evaluatee_cand?: { name: string } | null
}

export function EvaluationsPage() {
  const [showForm, setShowForm] = useState(false)

  const { data: evaluations = [], isLoading } = useQuery<Evaluation[]>({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const res = await api.get('/api/evaluations')
      return res.data.data
    },
  })

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Evaluations</h1>
        <Button onClick={() => setShowForm(true)}>New Evaluation</Button>
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-sm">
                <th className="text-left p-3 font-medium">Evaluatee</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Score</th>
                <th className="text-left p-3 font-medium">Bonus</th>
                <th className="text-left p-3 font-medium">Evaluator</th>
                <th className="text-left p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((evalItem) => (
                <tr key={evalItem.id_eval} className="border-b last:border-0">
                  <td className="p-3 text-sm font-medium">
                    {evalItem.evaluatee_emp?.name || evalItem.evaluatee_cand?.name || '—'}
                  </td>
                  <td className="p-3">
                    <Badge variant={evalItem.type_eval === 'Employee' ? 'default' : 'secondary'}>
                      {evalItem.type_eval}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className={`font-medium ${evalItem.score >= 70 ? 'text-green-600' : evalItem.score >= 40 ? 'text-yellow-600' : 'text-destructive'}`}>
                      {evalItem.score}/100
                    </span>
                  </td>
                  <td className="p-3 text-sm">{evalItem.bonus_amount > 0 ? `${evalItem.bonus_amount} DA` : '—'}</td>
                  <td className="p-3 text-sm">{evalItem.evaluator?.name}</td>
                  <td className="p-3 text-sm">{new Date(evalItem.date_eval).toLocaleDateString()}</td>
                </tr>
              ))}
              {evaluations.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-muted-foreground text-sm">No evaluations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {showForm && <EvaluationForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
