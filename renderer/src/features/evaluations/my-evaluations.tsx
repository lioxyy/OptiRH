import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { EyeIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMyEvaluations } from './api'

export function MyEvaluationsPage() {
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['my-evaluations'],
    queryFn: getMyEvaluations,
  })

  if (isLoading) return <div>Chargement de vos évaluations...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mes Évaluations</h2>
          <p className="text-muted-foreground">Consultez l'historique et les détails de vos performances.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-sm font-medium opacity-80 uppercase">Nombre d'Évaluations</p>
            <p className="text-3xl font-bold mt-2">{evaluations?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Dernière Note Obtenue</p>
            <p className="text-3xl font-bold mt-2 text-primary">
              {evaluations?.length > 0 ? `${evaluations[0].final_score.toFixed(2)} / 100` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Dernière Appréciation</p>
            <p className="text-3xl font-bold mt-2">
              {evaluations?.length > 0 ? evaluations[0].decision : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique de mes évaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Campagne</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Évaluateur</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Note Finale</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Décision</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {evaluations?.map((evalItem: any) => (
                  <tr key={evalItem.id_emp_eval} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">{evalItem.campaign.title}</td>
                    <td className="p-4 align-middle">{format(new Date(evalItem.date_eval), 'dd/MM/yyyy')}</td>
                    <td className="p-4 align-middle">{evalItem.evaluator.name}</td>
                    <td className="p-4 align-middle font-bold text-primary">{evalItem.final_score.toFixed(2)}</td>
                    <td className="p-4 align-middle">{evalItem.decision}</td>
                    <td className="p-4 align-middle">
                      <Link to={`/dashboard/evaluations/report/${evalItem.id_emp}`}>
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="h-4 w-4 mr-2" /> Voir en détail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!evaluations || evaluations.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">Vous n'avez pas encore été évalué(e).</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
