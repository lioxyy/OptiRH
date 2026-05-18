import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
  LineChart, Line, FunnelChart, Funnel, LabelList, Cell,
  PieChart, Pie, ResponsiveContainer
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent
} from '../../components/ui/chart'
import {
  Users,
  Briefcase,
  Activity,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Clock,
  MapPin,
  ShieldCheck,
  Globe
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

const deptConfig: ChartConfig = {
  count: { label: "Employees", color: "hsl(var(--chart-2))" },
}

const genderConfig: ChartConfig = {
  Male: { label: "Male", color: "hsl(var(--chart-1))" },
  Female: { label: "Female", color: "hsl(var(--chart-2))" },
  Other: { label: "Other", color: "hsl(var(--chart-3))" },
}

export function AnalyticsPage() {
  // Phase 1 Queries
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

  const { data: topPerformers } = useQuery({
    queryKey: ['analytics', 'top-performers'],
    queryFn: async () => (await api.get('/api/analytics/top-performers')).data.data,
  })

  const { data: absenteeRates } = useQuery({
    queryKey: ['analytics', 'absentee-rates'],
    queryFn: async () => (await api.get('/api/analytics/absentee-rates')).data.data,
  })

  // Phase 2 Queries
  const { data: headcountTrend } = useQuery({
    queryKey: ['analytics', 'headcount-trend'],
    queryFn: async () => (await api.get('/api/analytics/headcount-trend')).data.data,
  })

  const { data: deptStats } = useQuery({
    queryKey: ['analytics', 'department-stats'],
    queryFn: async () => (await api.get('/api/analytics/department-stats')).data.data,
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

  const kpis = [
    { title: 'Total Workforce', value: summary?.total_employees, icon: Users, color: 'text-primary', desc: 'Active personnel' },
    { title: 'Avg Tenure', value: tenureStats ? `${tenureStats.average_months} Mo` : null, icon: Clock, color: 'text-amber-500', desc: 'Organizational loyalty' },
    { title: 'Payroll Burn', value: summary ? `${(summary.monthly_payroll_cost / 1000).toFixed(1)}k DA` : null, icon: DollarSign, color: 'text-emerald-500', desc: 'Current month' },
    { title: 'Leave Load', value: summary ? `${summary.leave_rate}%` : null, icon: Activity, color: 'text-indigo-500', desc: 'Staff on leave' },
  ]

  if (isSummaryLoading) return <div className="p-8 space-y-4 shadow-none"><Skeleton className="h-10 w-48" /><div className="grid grid-cols-4 gap-4"><LoaderCard /><LoaderCard /><LoaderCard /><LoaderCard /></div></div>

  return (
    <div className="space-y-8 p-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground via-foreground/80 to-foreground/40 bg-clip-text text-transparent">HR Intelligence</h1>
        <p className="text-muted-foreground text-sm font-medium">Global workforce trends and operational KPIs.</p>
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
        {/* Headcount Trend (Phase 2) */}
        <Card className="lg:col-span-2 border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl overflow-hidden border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Growth trajectory
            </CardTitle>
            <CardDescription className="text-xs">12-month headcount evolution</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <ChartContainer config={headcountConfig} className="min-h-[300px] w-full">
              <LineChart data={headcountTrend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-count)" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Supervision Insights (Phase 2) */}
        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5 flex flex-col">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Organizational Span
            </CardTitle>
            <CardDescription className="text-xs">Employee distribution per supervisor</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-primary/5 max-h-[380px] overflow-y-auto">
              {supervisionStats?.map((s: any, i: number) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-primary/[0.03] transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground">Manager</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md">{s.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution (Phase 2) */}
        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" /> Department Density
            </CardTitle>
            <CardDescription className="text-xs">Current headcount allocation by department</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <ChartContainer config={deptConfig} className="min-h-[300px] w-full">
              <BarChart data={deptStats} layout="vertical">
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution (Phase 2) */}
        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-500" /> Demographics
            </CardTitle>
            <CardDescription className="text-xs">Gender and contract type breakdown</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 pt-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-tighter">Gender</span>
              <div className="h-[200px] w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={demographics?.gender}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {demographics?.gender?.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-tighter">Contract Type</span>
              <div className="h-[200px] w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={demographics?.contracts}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {demographics?.contracts?.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 3}))`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gender by Department (Stacked Bar - Phase 2) */}
      <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
        <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Diversity Mapping
          </CardTitle>
          <CardDescription className="text-xs">Gender distribution across company departments</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <ChartContainer config={genderConfig} className="min-h-[350px] w-full">
            <BarChart data={demographics?.genderByDept}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="Male" stackId="a" fill="var(--color-Male)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Female" stackId="a" fill="var(--color-Female)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Other" stackId="a" fill="var(--color-Other)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Phase 1 Elements (Preserved and Integrated) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> Payroll Burn
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <ChartContainer config={payrollConfig} className="min-h-[250px] w-full">
              <AreaChart data={payrollTrend}>
                <defs>
                  <linearGradient id="colorAmountPhase2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="amount" fill="url(#colorAmountPhase2)" stroke="var(--color-amount)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" /> Absence Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <ChartContainer config={{}} className="min-h-[250px] w-full">
              <BarChart data={absenteeRates}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sub-panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-500" /> Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Funnel dataKey="count" data={recruitmentData?.funnel || []} isAnimationActive>
                  <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="status" />
                  {recruitmentData?.funnel?.map((_e: any, i: number) => (
                    <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <ChartContainer config={{}} className="h-[200px] w-full">
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" hide />
                <YAxis hide />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-primary/5 bg-card/30 backdrop-blur-3xl shadow-xl border border-white/5 flex flex-col">
          <CardHeader className="border-b border-primary/5 bg-primary/[0.02]">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Elites
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[220px]">
            {topPerformers?.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="px-4 py-2 flex items-center justify-between text-[11px] border-b border-primary/5 last:border-0 hover:bg-primary/[0.02]">
                <span className="font-bold">{p.name}</span>
                <span className="font-mono bg-emerald-500/10 text-emerald-600 px-1.5 rounded">{p.avg_score.toFixed(1)}</span>
              </div>
            ))}
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
