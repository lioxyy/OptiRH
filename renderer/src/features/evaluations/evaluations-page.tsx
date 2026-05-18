import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { EvaluationForm } from './evaluation-form'
import { EvaluationReport } from './evaluation-report'
import { EvaluationConfigSheet } from './evaluation-config-sheet'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Plus,
  History,
  FileText,
  Settings2,
  Trophy,
  Users,
  Trash2,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../../context/auth-context'

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
  campaign?: { title: string } | null
  scores?: any[]
}

export function EvaluationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [viewingEvaluation, setViewingEvaluation] = useState<Evaluation | null>(null)

  const { data: evaluations = [], isLoading } = useQuery<Evaluation[]>({
    queryKey: ['evaluations'],
    queryFn: async () => (await api.get('/api/evaluations')).data.data,
  })

  const { data: stats } = useQuery({
    queryKey: ['eval-stats'],
    queryFn: async () => (await api.get('/api/evaluations/dashboard')).data.data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/evaluations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      queryClient.invalidateQueries({ queryKey: ['eval-stats'] })
      toast.success('Evaluation record removed')
    },
    onError: () => toast.error('Failed to remove record')
  })

  const listColumns = React.useMemo<ColumnDef<Evaluation>[]>(() => [
    {
      id: "evaluatee",
      accessorFn: (row) => row.evaluatee_emp?.name || row.evaluatee_cand?.name || '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Individual" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.original.evaluatee_emp?.name || row.original.evaluatee_cand?.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Ref: #{row.original.id_eval}</span>
        </div>
      )
    },
    {
      id: "type",
      accessorKey: "type_eval",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => (
        <Badge variant={row.original.type_eval === 'Employee' ? 'default' : 'secondary'} className="rounded-md">
          {row.original.type_eval}
        </Badge>
      )
    },
    {
      id: "campaign",
      accessorFn: (row) => row.campaign?.title || 'Ad-hoc',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Campaign" />,
    },
    {
      id: "score",
      accessorKey: "score",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${row.original.score >= 80 ? 'bg-green-500' : row.original.score >= 50 ? 'bg-yellow-500' : 'bg-destructive'}`}
              style={{ width: `${row.original.score}%` }}
            />
          </div>
          <span className="font-bold text-xs min-w-[3ch]">{row.original.score}</span>
        </div>
      )
    },
    {
      id: "evaluator",
      accessorFn: (row) => row.evaluator?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assessor" />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setViewingEvaluation(row.original)} className="h-8 gap-2 hover:bg-primary/5 hover:text-primary">
            <FileText className="h-3.5 w-3.5" />
            Report
          </Button>
          {user?.role === 'Admin' && (
            <Button variant="ghost" size="icon" onClick={() => {
              if (confirm('Delete this evaluation record?')) deleteMutation.mutate(row.original.id_eval)
            }} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ], [user])

  if (viewingEvaluation) {
    return <EvaluationReport evaluation={viewingEvaluation} onBack={() => setViewingEvaluation(null)} />
  }

  if (isLoading) return (
    <div className="p-12 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30">Analyzing Records</p>
    </div>
  )

  const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Performance Evaluations
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Management and analysis of organizational performance reviews.</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'Admin' && (
              <Button variant="outline" onClick={() => setShowConfig(true)} className="gap-2 border-primary/10 hover:bg-primary/5 hover:text-primary transition-all">
                <Settings2 className="h-4 w-4" />
                Config
              </Button>
            )}
            <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary">
              <Plus className="h-4 w-4" />
              New Evaluation
            </Button>
          </div>
        </div>

        <Tabs defaultValue="analysis" className="space-y-8">
          <div className="flex items-center justify-between border-b pb-1">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
              <TabsTrigger value="analysis" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Analysis
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 gap-2">
                <History className="h-4 w-4" />
                Record History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analysis" className="space-y-8 outline-none animate-in slide-in-from-bottom-2 duration-400">
            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Cumulative Reviews', val: stats?.totalEvaluations || 0, trend: '+4', foot: 'since last month', icon: FileText },
                { label: 'Avg Performance', val: `${Math.round(evaluations.reduce((acc: number, cur: any) => acc + cur.score, 0) / (evaluations.length || 1))}%`, trend: '+2.4%', foot: 'vs target 85%', icon: TrendingUp },
                { label: 'Active Campaigns', val: queryClient.getQueryData(['campaigns']) ? (queryClient.getQueryData(['campaigns']) as any[]).length : '—', trend: 'Stable', foot: 'Current cycle', icon: History },
                { label: 'Top Criterion', val: 'Technical', trend: 'High', foot: 'Based on 40 reviews', icon: Trophy },
              ].map((kpi, i) => (
                <Card key={i} className="border-primary/5 bg-card/40 backdrop-blur-sm shadow-sm hover:border-primary/20 transition-all group p-4">
                  <div className="flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-muted-foreground opacity-80">{kpi.label}</span>
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground opacity-40 rotate-45" />
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <h3 className="text-2xl font-bold tracking-tight">{kpi.val}</h3>
                      <div className="px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] font-bold text-green-500 flex items-center gap-1">
                        <TrendingUp className="h-2.5 w-2.5" />
                        {kpi.trend}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-primary/5">
                      <p className="text-[10px] text-muted-foreground font-medium opacity-60">
                        <span className="font-bold">{kpi.foot.split(' ')[0]}</span> {kpi.foot.split(' ').slice(1).join(' ')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
              {/* PRIMARY CHART */}
              <Card className="col-span-4 border-primary/5 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-muted rounded flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight">Department Benchmarks</CardTitle>
                      <CardDescription className="text-xs">Organizational performance distribution by sector.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[350px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.averageByDept || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} fontWeight="bold" />
                        <YAxis domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'medium' }}
                          cursor={{ fill: 'currentColor', opacity: 0.03 }}
                        />
                        <Bar dataKey="average" radius={[8, 8, 2, 2]} barSize={45}>
                          {(stats?.averageByDept || []).map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* TOP PERFORMERS LIST */}
              <Card className="col-span-3 border-primary/5 shadow-lg relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-muted rounded flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight">Vanguard Performers</CardTitle>
                      <CardDescription className="text-xs">Leading personnel by aggregate excellence rating.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-1">
                    {stats?.topPerformers?.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all group border border-transparent">
                        <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold tracking-tight">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium opacity-50">Performance Tier</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-primary tracking-tight">{p.score}%</span>
                        </div>
                      </div>
                    ))}
                    {(!stats?.topPerformers || stats.topPerformers.length === 0) && (
                      <div className="py-24 text-center space-y-3 opacity-40">
                        <Users className="h-12 w-12 mx-auto stroke-[1]" />
                        <p className="text-sm font-medium italic">Establishing baseline data...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="outline-none animate-in slide-in-from-bottom-2 duration-400">
            <GenericDataTable
              columns={listColumns}
              data={evaluations}
              searchOptions={[
                { id: "evaluatee", label: "Personnel Name" },
                { id: "evaluator", label: "Assessor" },
                { id: "type", label: "Category" }
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>

      <EvaluationForm open={showForm} onOpenChange={setShowForm} />
      <EvaluationConfigSheet open={showConfig} onOpenChange={setShowConfig} />
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
