import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { getDashboardStats } from './api'

export function EvaluationsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['eval-stats'],
    queryFn: getDashboardStats,
  })

  if (isLoading) return <div>Chargement des statistiques...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tableau de Bord des Évaluations</h2>
          <p className="text-muted-foreground">Suivez les performances de vos collaborateurs.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Link to="/dashboard/evaluations/campaigns">
            <Button variant="outline">Campagnes</Button>
          </Link>
          <Link to="/dashboard/evaluations/criteria">
            <Button variant="outline">Critères</Button>
          </Link>
          <Link to="/dashboard/evaluations/history">
            <Button variant="outline">Historique Complet</Button>
          </Link>
          <Link to="/dashboard/evaluations/new">
            <Button>Nouvelle Évaluation</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Évaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvaluations || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Moyenne par Département (Semestrielle)</CardTitle>
            <CardDescription>Note moyenne sur tous les critères (campagnes semestrielles uniquement).</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats?.averagePerDept || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Performeurs</CardTitle>
            <CardDescription>Les 5 meilleurs employés.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats?.topPerformers?.map((p: any, i: number) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.campaign}</p>
                  </div>
                  <div className="ml-auto font-medium text-green-600">{p.score}</div>
                </div>
              ))}
              {(!stats?.topPerformers || stats.topPerformers.length === 0) && (
                <div className="text-sm text-muted-foreground">Aucune donnée.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
