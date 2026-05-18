import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
  LineChart, Line, FunnelChart, Funnel, LabelList, Cell
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from '../../components/ui/chart'
import {
  Users,
  Briefcase,
  Activity,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertCircle
} from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Summary {
  total_employees: number
  open_positions: number
  monthly_payroll_cost: number
  leave_rate: number
}

const payrollConfig: ChartConfig = {
  amount: {
    label: "Payroll Cost",
    color: "hsl(var(--primary))",
  },
}

const scoreConfig: ChartConfig = {
  count: {
    label: "Frequency",
    color: "hsl(var(--chart-2))",
  }
}

const attendanceConfig: ChartConfig = {
  count: {
    label: "Absences",
    color: "hsl(var(--destructive))",
  }
}

export function AnalyticsPage() {
  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<Summary>({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => (await api.get('/api/analytics/summary')).data.data,
  })

  const { data: payrollTrend } = useQuery({
    queryKey: ['analytics', 'payroll-trend'],
    queryFn: async () => (await api.get('/api/analytics/payroll-trend')).data.data,
  })

  const { data: scoreDistribution } = useQuery({
    queryKey: ['analytics', 'score-distribution'],
    queryFn: async () => (await api.get('/api/analytics/score-distribution')).data.data,
  })

  const { data: recruitmentData } = useQuery({
    queryKey: ['analytics', 'recruitment'],
    queryFn: async () => (await api.get('/api/analytics/recruitment')).data.data,
  })

  const { data: absenteeRates } = useQuery({
    queryKey: ['analytics', 'absentee-rates'],
    queryFn: async () => (await api.get('/api/analytics/absentee-rates')).data.data,
  })

  const { data: topPerformers } = useQuery({
    queryKey: ['analytics', 'top-performers'],
    queryFn: async () => (await api.get('/api/analytics/top-performers')).data.data,
  })

  const kpis = [
    { title: 'Total Workforce', value: summary?.total_employees, icon: Users, color: 'text-primary', desc: 'Active personnel' },
    { title: 'Talent Pool', value: summary?.open_positions, icon: Briefcase, color: 'text-amber-500', desc: 'Open pipeline' },
    { title: 'Payroll Burn', value: summary ? `${(summary.monthly_payroll_cost / 1000).toFixed(1)}k DA` : null, icon: DollarSign, color: 'text-emerald-500', desc: 'Current month' },
    { title: 'Leave Load', value: summary ? `${summary.leave_rate}%` : null, icon: Activity, color: 'text-indigo-500', desc: 'Staff on leave' },
  ]

  if (isSummaryLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-4 gap-4"><LoaderCard /><LoaderCard /><LoaderCard /><LoaderCard /></div></div>

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">Executive Overview</h1>
        <p className="text-muted-foreground text-sm">Real-time indicators and predictive trends across human capital metrics.</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg hover:shadow-xl hover:border-primary/10 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{kpi.title}</CardTitle>
              <div className={cn("p-2 rounded-lg bg-background/50 border border-primary/5 group-hover:scale-110 transition-transform", kpi.color)}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{kpi.value ?? '—'}</div>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> {kpi.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Trend */}
        <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col">
          <CardHeader className="border-b border-primary/5 bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> Payroll Evolution
            </CardTitle>
            <CardDescription className="text-xs">12-month historical expenditure trend</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <ChartContainer config={payrollConfig} className="min-h-[300px] w-full">
              <AreaChart data={payrollTrend}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-amount)"
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recruitment Funnel */}
        <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden">
          <CardHeader className="border-b border-primary/5 bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-500" /> Recruitment Funnel
            </CardTitle>
            <CardDescription className="text-xs">Candidate conversion across pipeline stages</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={{}} className="min-h-[300px] w-full">
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="count"
                  data={recruitmentData?.funnel || []}
                  isAnimationActive
                >
                  <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="status" />
                  {recruitmentData?.funnel?.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden">
          <CardHeader className="border-b border-primary/5 bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> Performance Distribution
            </CardTitle>
            <CardDescription className="text-xs">Employee score frequency buckets (Histogram)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={scoreConfig} className="min-h-[300px] w-full">
              <BarChart data={scoreDistribution}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Performers List */}
        <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col">
          <CardHeader className="border-b border-primary/5 bg-muted/20">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Elite Performers
            </CardTitle>
            <CardDescription className="text-xs">Top 10 employees by historical average score</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-primary/5">
              {topPerformers?.map((perf: any, i: number) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold border",
                      i === 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        i === 1 ? "bg-slate-400/10 text-slate-400 border-slate-400/20" :
                          i === 2 ? "bg-orange-700/10 text-orange-700 border-orange-700/20" :
                            "bg-muted text-muted-foreground border-transparent"
                    )}>
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold group-hover:text-primary transition-colors">{perf.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${perf.avg_score}%` }} />
                    </div>
                    <span className="font-mono text-xs font-bold w-12 text-right">{perf.avg_score.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Absentee Trend */}
      <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden">
        <CardHeader className="border-b border-primary/5 bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" /> Absenteism Insights
          </CardTitle>
          <CardDescription className="text-xs">12-month trend of workforce absences</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer config={attendanceConfig} className="min-h-[250px] w-full">
            <LineChart data={absenteeRates}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => val.split('-').slice(1).join('/')}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="stepAfter"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--color-count)", strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function LoaderCard() {
  return (
    <Card className="border-primary/5 bg-card/40">
      <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
      <CardContent><Skeleton className="h-8 w-16" /></CardContent>
    </Card>
  )
}
