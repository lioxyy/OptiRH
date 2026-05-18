import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { EyeIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getEvaluationsHistory } from './api'

export function EvaluationsHistory() {
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evals-history'],
    queryFn: getEvaluationsHistory,
  })

  if (isLoading) return <div>Chargement de l'historique...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historique des Évaluations</h2>
          <p className="text-muted-foreground">Consultez toutes les évaluations passées.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les Évaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Employé</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Département</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Campagne</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Évaluateur</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Note Finale</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {evaluations?.map((evalItem: any) => (
                  <tr key={evalItem.id_emp_eval} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">{evalItem.employee.name}</td>
                    <td className="p-4 align-middle">{evalItem.employee.department?.name || '-'}</td>
                    <td className="p-4 align-middle">{evalItem.campaign.title}</td>
                    <td className="p-4 align-middle">{format(new Date(evalItem.date_eval), 'dd/MM/yyyy')}</td>
                    <td className="p-4 align-middle">{evalItem.evaluator.name}</td>
                    <td className="p-4 align-middle font-bold text-primary">{evalItem.final_score.toFixed(2)}</td>
                    <td className="p-4 align-middle">
                      <Link to={`/dashboard/evaluations/report/${evalItem.id_emp}`}>
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="h-4 w-4 mr-2" /> Rapport
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!evaluations || evaluations.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">Aucune évaluation n'a été trouvée.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
