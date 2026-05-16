import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'

interface Summary {
  total_employees: number
  open_positions: number
  monthly_payroll_cost: number
  leave_rate: number
}

export function AnalyticsPage() {
  const { data: summary } = useQuery<Summary>({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const res = await api.get('/api/analytics/summary')
      return res.data.data
    },
  })

  const { data: diversity } = useQuery({
    queryKey: ['analytics-diversity'],
    queryFn: async () => {
      const res = await api.get('/api/analytics/diversity')
      return res.data.data
    },
  })

  const { data: absenteeRates } = useQuery({
    queryKey: ['analytics-absentee'],
    queryFn: async () => {
      const res = await api.get('/api/analytics/absentee-rates')
      return res.data.data
    },
  })

  const { data: recruitmentStats } = useQuery({
    queryKey: ['analytics-recruitment'],
    queryFn: async () => {
      const res = await api.get('/api/analytics/recruitment')
      return res.data.data
    },
  })

  const { data: topPerformers } = useQuery({
    queryKey: ['analytics-performers'],
    queryFn: async () => {
      const res = await api.get('/api/analytics/top-performers')
      return res.data.data
    },
  })

  const kpiCards = [
    { title: 'Total Employees', value: summary?.total_employees ?? '—', color: 'text-blue-600' },
    { title: 'Open Positions', value: summary?.open_positions ?? '—', color: 'text-amber-600' },
    { title: 'Monthly Payroll', value: summary ? `${summary.monthly_payroll_cost.toLocaleString()} DA` : '—', color: 'text-green-600' },
    { title: 'Leave Rate', value: summary ? `${summary.leave_rate}%` : '—', color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Department Diversity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={diversity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Absentee Rates (12 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={absenteeRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Recruitment Evolution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recruitmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Pending" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Accepted" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Rejected" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top Performers</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPerformers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="avg_score" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
