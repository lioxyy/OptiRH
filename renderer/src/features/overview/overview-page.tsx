import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, CalendarDays, HeartPulse, LineChart, Medal, SearchCheck, ShieldHalf, TrendingUp, Users, UsersRound, UserPlus } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, Cell, CartesianGrid, Line, LineChart as RechartsLineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'

const kpis = [
  {
    title: 'Total headcount',
    value: '1,248',
    change: '+6.2% YoY',
    trend: 'up' as const,
    description: '54 net additions this quarter',
    icon: Users,
  },
  {
    title: 'Open requisitions',
    value: '34',
    change: '-8.1% MoM',
    trend: 'down' as const,
    description: '12 roles are in final interview stage',
    icon: UserPlus,
  },
  {
    title: 'Absence rate',
    value: '2.9%',
    change: '-0.4 pts',
    trend: 'down' as const,
    description: 'Sick leave is the main driver',
    icon: HeartPulse,
  },
  {
    title: 'Performance index',
    value: '87/100',
    change: '+4.8 pts',
    trend: 'up' as const,
    description: 'Top quartile contributors lifted this month',
    icon: Medal,
  },
]

const headcountTrend = [
  { month: 'Jan', total: 1128, permanent: 878, contract: 250 },
  { month: 'Feb', total: 1140, permanent: 886, contract: 254 },
  { month: 'Mar', total: 1159, permanent: 898, contract: 261 },
  { month: 'Apr', total: 1188, permanent: 915, contract: 273 },
  { month: 'May', total: 1216, permanent: 932, contract: 284 },
  { month: 'Jun', total: 1248, permanent: 955, contract: 293 },
]

const diversityData = [
  { name: 'Women', value: 46, fill: 'hsl(221 83% 53%)' },
  { name: 'Men', value: 51, fill: 'hsl(160 84% 39%)' },
  { name: 'Non-binary / not disclosed', value: 3, fill: 'hsl(262 83% 58%)' },
]

const absenceTrend = [
  { month: 'Jan', sick: 1.2, planned: 0.8, unplanned: 0.9 },
  { month: 'Feb', sick: 1.4, planned: 0.7, unplanned: 1.0 },
  { month: 'Mar', sick: 1.1, planned: 0.9, unplanned: 0.8 },
  { month: 'Apr', sick: 1.6, planned: 0.8, unplanned: 1.1 },
  { month: 'May', sick: 1.0, planned: 0.7, unplanned: 0.9 },
  { month: 'Jun', sick: 1.3, planned: 0.8, unplanned: 0.8 },
]

const recruitmentPipeline = [
  { stage: 'Applicants', count: 820 },
  { stage: 'Screened', count: 322 },
  { stage: 'Interviewed', count: 148 },
  { stage: 'Offers', count: 41 },
  { stage: 'Hires', count: 27 },
]

const topPerformers = [
  { name: 'Amina Diallo', team: 'People Ops', score: 98, contribution: '+12%' },
  { name: 'Omar Farouk', team: 'Engineering', score: 95, contribution: '+9%' },
  { name: 'Sofia Martins', team: 'Recruitment', score: 93, contribution: '+7%' },
  { name: 'Grace Okafor', team: 'Finance', score: 91, contribution: '+6%' },
  { name: 'Lucas Meyer', team: 'Customer Success', score: 89, contribution: '+5%' },
]

const headcountChartConfig = {
  total: { label: 'Total headcount', color: 'hsl(221 83% 53%)' },
  permanent: { label: 'Permanent', color: 'hsl(160 84% 39%)' },
  contract: { label: 'Contract', color: 'hsl(262 83% 58%)' },
} as const

const diversityChartConfig = {
  value: { label: 'Workforce share' },
} as const

const absenceChartConfig = {
  sick: { label: 'Sick leave', color: 'hsl(0 84% 60%)' },
  planned: { label: 'Planned leave', color: 'hsl(221 83% 53%)' },
  unplanned: { label: 'Unplanned leave', color: 'hsl(38 92% 50%)' },
} as const

const recruitmentChartConfig = {
  count: { label: 'Candidates', color: 'hsl(262 83% 58%)' },
} as const

const performanceChartConfig = {
  score: { label: 'Performance score', color: 'hsl(160 84% 39%)' },
} as const

function TrendBadge({ trend, value }: { trend: 'up' | 'down'; value: string }) {
  const Icon = trend === 'up' ? ArrowUpRight : ArrowDownRight

  return (
    <Badge
      variant="outline"
      className={trend === 'up' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-rose-500/30 bg-rose-500/10 text-rose-600'}
    >
      <Icon className="mr-1 size-3" />
      {value}
    </Badge>
  )
}

function MetricCard({ item }: { item: (typeof kpis)[number] }) {
  const Icon = item.icon

  return (
    <Card className="border-border/60">
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{item.title}</CardDescription>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl tabular-nums">{item.value}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TrendBadge trend={item.trend} value={item.change} />
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </CardContent>
    </Card>
  )
}

function SectionTitle({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold leading-none">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function OverviewPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 pt-0">
      <Card className="overflow-hidden border-border/60">
        <CardHeader className="gap-4 border-b pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionTitle
              title="Admin dashboard"
              description="Global workforce performance across headcount, diversity, absence, recruitment, and individual achievement."
              icon={ShieldHalf}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                <CalendarDays className="size-3.5" />
                Updated today
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-muted-foreground">
                Executive view
              </Badge>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <MetricCard key={item.title} item={item} />
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden border-border/60">
          <CardHeader>
            <SectionTitle
              title="Headcount statistics"
              description="Track workforce growth, workforce mix, and permanent vs contract ratios over time."
              icon={UsersRound}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <ChartContainer config={headcountChartConfig} className="aspect-auto h-70 w-full">
              <AreaChart data={headcountTrend}>
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area dataKey="total" type="monotone" fill="url(#fillTotal)" stroke="var(--color-total)" strokeWidth={2.5} />
                <Area dataKey="permanent" type="monotone" fillOpacity={0} stroke="var(--color-permanent)" strokeWidth={2} />
                <Area dataKey="contract" type="monotone" fillOpacity={0} stroke="var(--color-contract)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Permanent</p>
                <p className="mt-1 text-2xl font-semibold">955</p>
                <p className="text-sm text-emerald-600">+5.7% YoY</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Contract</p>
                <p className="mt-1 text-2xl font-semibold">293</p>
                <p className="text-sm text-primary">24% of headcount</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Attrition</p>
                <p className="mt-1 text-2xl font-semibold">1.8%</p>
                <p className="text-sm text-amber-600">Below target threshold</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/60">
          <CardHeader>
            <SectionTitle
              title="Diversity analytics"
              description="Monitor representation, leadership balance, and inclusion progress across the workforce."
              icon={Users}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              <ChartContainer config={diversityChartConfig} className="aspect-auto h-60 w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel indicator="dot" />} />
                  <Pie data={diversityData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={92} paddingAngle={3}>
                    {diversityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="space-y-3">
                {diversityData.map((entry) => (
                  <div key={entry.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-medium">{entry.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: `${entry.value}%`, backgroundColor: entry.fill }} />
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Women in leadership</p>
                    <p className="mt-1 text-xl font-semibold">39%</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Pay equity gap</p>
                    <p className="mt-1 text-xl font-semibold">2.1%</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Inclusion survey</p>
                    <p className="mt-1 text-xl font-semibold">84/100</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Representation goals</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-600">On track</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden border-border/60">
          <CardHeader>
            <SectionTitle
              title="Absence analytics"
              description="Review leave trends by month to spot spikes in sick, planned, and unplanned absence."
              icon={HeartPulse}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <ChartContainer config={absenceChartConfig} className="aspect-auto h-70 w-full">
              <RechartsLineChart data={absenceTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line type="monotone" dataKey="sick" stroke="var(--color-sick)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="planned" stroke="var(--color-planned)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="unplanned" stroke="var(--color-unplanned)" strokeWidth={2.5} dot={false} />
              </RechartsLineChart>
            </ChartContainer>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Sick leave</p>
                <p className="mt-1 text-2xl font-semibold">1.3%</p>
                <p className="text-sm text-rose-600">Highest in April</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Planned leave</p>
                <p className="mt-1 text-2xl font-semibold">0.8%</p>
                <p className="text-sm text-primary">Stable across the quarter</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Unplanned leave</p>
                <p className="mt-1 text-2xl font-semibold">0.9%</p>
                <p className="text-sm text-amber-600">Needs proactive follow-up</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/60">
          <CardHeader>
            <SectionTitle
              title="Recruitment analytics"
              description="Follow the pipeline from applicants to hires and measure conversion strength."
              icon={SearchCheck}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <ChartContainer config={recruitmentChartConfig} className="aspect-auto h-70 w-full">
              <BarChart data={recruitmentPipeline} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" tickLine={false} axisLine={false} width={100} />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="count" radius={[0, 10, 10, 0]} fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fill rate</p>
                <p className="mt-1 text-2xl font-semibold">79%</p>
                <p className="text-sm text-emerald-600">Improving month over month</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Time to hire</p>
                <p className="mt-1 text-2xl font-semibold">28 days</p>
                <p className="text-sm text-primary">3 days faster than target</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Offer acceptance</p>
                <p className="mt-1 text-2xl font-semibold">88%</p>
                <p className="text-sm text-amber-600">Competing offers remain a risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-border/60">
          <CardHeader>
            <SectionTitle
              title="Top performers"
              description="Rank the strongest contributors by performance score and quarterly momentum."
              icon={TrendingUp}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <ChartContainer config={performanceChartConfig} className="aspect-auto h-75 w-full">
              <BarChart data={topPerformers} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={130} />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="score" fill="var(--color-score)" radius={[0, 10, 10, 0]}>
                  {topPerformers.map((entry) => (
                    <Cell key={entry.name} fill="var(--color-score)" />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/60">
          <CardHeader>
            <SectionTitle
              title="Performance summary"
              description="Quick scan of the teams and signals behind the top performers chart."
              icon={LineChart}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.map((person, index) => (
              <div key={person.name} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                      <p className="font-medium">{person.name}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{person.team}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tabular-nums">{person.score}</p>
                    <p className="text-sm text-emerald-600">{person.contribution}</p>
                  </div>
                </div>
              </div>
            ))}
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">High performers retained</p>
                <p className="mt-1 text-xl font-semibold">97%</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Ready successors</p>
                <p className="mt-1 text-xl font-semibold">21</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
