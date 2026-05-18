import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BriefcaseIcon, UsersIcon, CalendarIcon, TrendingUpIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getRecruitmentStats } from './api'

const STATUS_COLORS: Record<string, string> = {
  'Reçue': 'bg-blue-100 text-blue-800',
  'EnCours': 'bg-yellow-100 text-yellow-800',
  'Entretien': 'bg-purple-100 text-purple-800',
  'Acceptée': 'bg-green-100 text-green-800',
  'Rejetée': 'bg-red-100 text-red-800',
}

export function RecruitmentDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['recruitment-stats'],
    queryFn: getRecruitmentStats,
  })

  if (isLoading) return <div className="p-6">Chargement...</div>

  const chartData = stats?.offersWithCount?.map((o: any) => ({
    name: o.title.length > 20 ? o.title.slice(0, 20) + '...' : o.title,
    candidatures: o._count.applications,
  })) || []

  const statusData = stats?.applicationsByStatus?.map((s: any) => ({
    name: s.status,
    count: s._count.id_application,
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Module Recrutement</h2>
          <p className="text-muted-foreground">Gérez tout le cycle de recrutement.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/recruitment/offers">
            <Button>Gérer les Offres</Button>
          </Link>
          <Link to="/dashboard/recruitment/applications">
            <Button variant="outline">Candidatures (Kanban)</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Offres Actives', value: stats?.publishedOffers ?? 0, icon: BriefcaseIcon, sub: `${stats?.totalOffers ?? 0} total` },
          { title: 'Candidats', value: stats?.totalCandidates ?? 0, icon: UsersIcon, sub: 'inscrits' },
          { title: 'Candidatures', value: stats?.totalApplications ?? 0, icon: TrendingUpIcon, sub: 'reçues' },
          { title: 'Entretiens à venir', value: stats?.upcomingInterviews ?? 0, icon: CalendarIcon, sub: 'planifiés' },
        ].map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Candidatures par offre */}
        <Card>
          <CardHeader>
            <CardTitle>Candidatures par Offre</CardTitle>
            <CardDescription>Top 5 des offres les plus demandées</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="candidatures" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Candidatures</CardTitle>
            <CardDescription>Par statut dans le pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {statusData.map((s: any) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[s.name] || 'bg-gray-100 text-gray-800'}`}>
                  {s.name}
                </span>
                <span className="font-bold text-lg">{s.count}</span>
              </div>
            ))}
            {statusData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune candidature pour l'instant.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Offres d\'emploi', to: '/dashboard/recruitment/offers', icon: BriefcaseIcon },
          { label: 'Candidats', to: '/dashboard/recruitment/candidates', icon: UsersIcon },
          { label: 'Pipeline Kanban', to: '/dashboard/recruitment/applications', icon: TrendingUpIcon },
          { label: 'Entretiens', to: '/dashboard/recruitment/interviews', icon: CalendarIcon },
        ].map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <link.icon className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">{link.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
