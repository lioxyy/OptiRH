import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
  LineChart, Line, FunnelChart, Funnel, Cell,
  PieChart, Pie, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from '../../components/ui/chart'
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Clock,
  PieChart as PieChartIcon
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
  amount: { label: "Payroll Cost", color: "hsl(var(--primary))" },
}

const headcountConfig: ChartConfig = {
  count: { label: "Headcount", color: "hsl(var(--chart-1))" },
}

const absenceConfig: ChartConfig = {
  rate: { label: "Absence Rate (%)", color: "hsl(var(--destructive))" },
  justified: { label: "Justified", color: "hsl(var(--chart-2))" },
  unjustified: { label: "Unjustified", color: "hsl(var(--destructive))" },
}

const utilizationConfig: ChartConfig = {
  consumed: { label: "Consumed", color: "hsl(var(--primary))" },
  allocated: { label: "Allocated", color: "hsl(var(--muted-foreground))" },
}

export function AnalyticsPage() {
  // Phase 1 & 2 Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery<Summary>({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => (await api.get('/api/analytics/summary')).data.data,
  })

  const { data: payrollTrend } = useQuery({
    queryKey: ['analytics', 'payroll-trend'],
    queryFn: async () => (await api.get('/api/analytics/payroll-trend')).data.data,
  })

  const { data: recruitmentData } = useQuery({
    queryKey: ['analytics', 'recruitment'],
    queryFn: async () => (await api.get('/api/analytics/recruitment')).data.data,
  })

  const { data: scoreDistribution } = useQuery({
    queryKey: ['analytics', 'score-distribution'],
    queryFn: async () => (await api.get('/api/analytics/score-distribution')).data.data,
  })


  const { data: headcountTrend } = useQuery({
    queryKey: ['analytics', 'headcount-trend'],
    queryFn: async () => (await api.get('/api/analytics/headcount-trend')).data.data,
  })


  const { data: demographics } = useQuery({
    queryKey: ['analytics', 'demographics'],
    queryFn: async () => (await api.get('/api/analytics/demographics')).data.data,
  })

  const { data: tenureStats } = useQuery({
    queryKey: ['analytics', 'tenure-stats'],
    queryFn: async () => (await api.get('/api/analytics/tenure-stats')).data.data,
  })

  const { data: supervisionStats } = useQuery({
    queryKey: ['analytics', 'supervision-stats'],
    queryFn: async () => (await api.get('/api/analytics/supervision-stats')).data.data,
  })

  // Phase 3 Queries
  const { data: absenceDeepDive } = useQuery({
    queryKey: ['analytics', 'absence-deep-dive'],
    queryFn: async () => (await api.get('/api/analytics/absence-deep-dive')).data.data,
  })

  const { data: leaveUtilization } = useQuery({
    queryKey: ['analytics', 'leave-utilization'],
    queryFn: async () => (await api.get('/api/analytics/leave-utilization')).data.data,
  })

  const kpis = [
    { title: 'Total Workforce', value: summary?.total_employees, icon: Users, color: 'text-primary', desc: 'Active personnel' },
    { title: 'Avg Tenure', value: tenureStats ? `${tenureStats.average_months} Mo` : null, icon: Clock, color: 'text-amber-500', desc: 'Organizational loyalty' },
    { title: 'Payroll Burn', value: summary ? `${(summary.monthly_payroll_cost / 1000).toFixed(1)}k DA` : null, icon: DollarSign, color: 'text-emerald-500', desc: 'Current month' },
    { title: 'Leave Load', value: summary ? `${summary.leave_rate}%` : null, icon: Activity, color: 'text-indigo-500', desc: 'Staff on leave' },
  ]

  if (isSummaryLoading) return <div className="p-8 space-y-4"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-4 gap-4"><LoaderCard /><LoaderCard /><LoaderCard /><LoaderCard /></div></div>

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground via-foreground/80 to-foreground/40 bg-clip-text text-transparent">HR Intelligence</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em] opacity-80">Phase 3: Deep-Dive Absence & Leaves</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-2xl border border-white/5 hover:border-primary/20 transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <kpi.icon className="h-24 w-24 -mr-8 -mt-8" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.title}</CardTitle>
              <div className={cn("p-2 rounded-xl bg-background/50 border border-primary/5 group-hover:rotate-12 transition-transform shadow-inner", kpi.color)}>
                <kpi.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black tracking-tight">{kpi.value ?? '—'}</div>
              <p className="text-[10px] font-semibold text-muted-foreground mt-2 flex items-center gap-1.5 bg-primary/5 w-fit px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> {kpi.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Absence Rate Trend (Phase 3) */}
        <Card className="lg:col-span-2 border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
              <Activity className="h-4 w-4" /> Absenteeism Rate Trend
            </CardTitle>
            <CardDescription className="text-xs">Percentage of total workforce absences vs capacity</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <ChartContainer config={absenceConfig} className="min-h-[300px] w-full">
              <AreaChart data={absenceDeepDive}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="rate" fill="url(#colorRate)" stroke="var(--color-rate)" strokeWidth={3} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5 flex flex-col">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Justification Analysis
            </CardTitle>
            <CardDescription className="text-xs">Historical validation of absences</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 flex-1">
            <ChartContainer config={absenceConfig} className="min-h-[250px] w-full">
              <BarChart data={absenceDeepDive}>
                <XAxis dataKey="month" hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="justified" stackId="a" fill="var(--color-justified)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="unjustified" stackId="a" fill="var(--color-unjustified)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-indigo-500" /> Leave Balance Utilization
            </CardTitle>
            <CardDescription className="text-xs">Proportional consumption of allocated leave types</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-6">
            <ChartContainer config={utilizationConfig} className="h-full w-full">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={leaveUtilization}>
                <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
                <PolarAngleAxis dataKey="type" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                <Radar name="Consumed (%)" dataKey="utilization" stroke="var(--color-consumed)" fill="var(--color-consumed)" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
            <CardHeader className="py-3 px-5 border-b border-primary/5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-70">Workforce Growth</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartContainer config={headcountConfig} className="h-[200px] w-full">
                <LineChart data={headcountTrend}>
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <Line type="stepAfter" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
            <CardHeader className="py-3 px-5 border-b border-primary/5">
              <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-70">Global Diversity</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 pt-4">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Gender</span>
                <div className="h-24 w-24">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={demographics?.gender} cx="50%" cy="50%" innerRadius={25} outerRadius={35} dataKey="value">
                        {demographics?.gender?.map((_e: any, i: number) => <Cell key={i} fill={`hsl(var(--chart-${i + 1}))`} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Contracts</span>
                <div className="h-24 w-24">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={demographics?.contracts} cx="50%" cy="50%" innerRadius={25} outerRadius={35} dataKey="value">
                        {demographics?.contracts?.map((_e: any, i: number) => <Cell key={i} fill={`hsl(var(--chart-${i + 3}))`} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Roles</span>
                <div className="h-24 w-24">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={demographics?.roles} cx="50%" cy="50%" innerRadius={25} outerRadius={35} dataKey="value">
                        {demographics?.roles?.map((_e: any, i: number) => <Cell key={i} fill={`hsl(var(--chart-${i + 1}))`} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Phase 1 & 2 Refined Elements Footer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5 overflow-hidden">
          <CardHeader className="py-2 border-b border-primary/5 bg-primary/[0.01]">
            <CardTitle className="text-[10px] font-bold uppercase opacity-60">Financial Evolution</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={payrollConfig} className="h-24 w-full">
              <AreaChart data={payrollTrend}>
                <Area dataKey="amount" stroke="var(--color-amount)" fill="var(--color-amount)" fillOpacity={0.1} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5 overflow-hidden">
          <CardHeader className="py-2 border-b border-primary/5 bg-primary/[0.01]">
            <CardTitle className="text-[10px] font-bold uppercase opacity-60">Performance Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={{}} className="h-24 w-full">
              <BarChart data={scoreDistribution}>
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={2} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5 overflow-hidden flex flex-col">
          <CardHeader className="py-2 border-b border-primary/5 bg-primary/[0.01]">
            <CardTitle className="text-[10px] font-bold uppercase opacity-60">Span of Control</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1 overflow-y-auto max-h-[100px]">
            {supervisionStats?.slice(0, 3).map((s: any, i: number) => (
              <div key={i} className="flex justify-between text-[9px] mb-1">
                <span>{s.name}</span>
                <span className="font-bold">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5 overflow-hidden">
          <CardHeader className="py-2 border-b border-primary/5 bg-primary/[0.01]">
            <CardTitle className="text-[10px] font-bold uppercase opacity-60">Recruitment Conversion</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={{}} className="h-24 w-full">
              <FunnelChart>
                <Funnel dataKey="count" data={recruitmentData?.funnel} isAnimationActive={false}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--primary))" opacity={0.8} />
                  <Cell fill="hsl(var(--primary))" opacity={0.6} />
                  <Cell fill="hsl(var(--primary))" opacity={0.4} />
                </Funnel>
              </FunnelChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
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
