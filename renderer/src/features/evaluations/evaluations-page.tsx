import * as React from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { EvaluationForm } from './evaluation-form'
import { EvaluationReport } from './evaluation-report'
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
  BarChart3,
  FileText,
  Settings2,
  Trophy,
  Users
} from 'lucide-react'

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
  const [showForm, setShowForm] = useState(false)
  const [viewingEvaluation, setViewingEvaluation] = useState<Evaluation | null>(null)

  const { data: evaluations = [], isLoading } = useQuery<Evaluation[]>({
    queryKey: ['evaluations'],
    queryFn: async () => (await api.get('/api/evaluations')).data.data,
  })

  const { data: stats } = useQuery({
    queryKey: ['eval-stats'],
    queryFn: async () => (await api.get('/api/evaluations/dashboard')).data.data,
  })

  const listColumns = React.useMemo<ColumnDef<Evaluation>[]>(() => [
    {
      id: "evaluatee",
      accessorFn: (row) => row.evaluatee_emp?.name || row.evaluatee_cand?.name || '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Individual" />,
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
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${row.original.score >= 80 ? 'bg-green-500' : row.original.score >= 50 ? 'bg-yellow-500' : 'bg-destructive'}`}
              style={{ width: `${row.original.score}%` }}
            />
          </div>
          <span className="font-bold text-xs">{row.original.score}/100</span>
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
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setViewingEvaluation(row.original)} className="gap-2">
          <FileText className="h-3 w-3" />
          Report
        </Button>
      )
    }
  ], [])

  if (viewingEvaluation) {
    return <EvaluationReport evaluation={viewingEvaluation} onBack={() => setViewingEvaluation(null)} />
  }

  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            Personnel Performance
            <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-0.5 border-primary/20 text-primary">Excellence</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Unified assessment engine for organization-wide performance auditing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-primary/10">
            <Settings2 className="h-4 w-4" />
            Config
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            New Evaluation
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border border-primary/5">
          <TabsTrigger value="analysis" className="gap-2 px-6">
            <BarChart3 className="h-4 w-4" />
            Performance Analysis
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 px-6">
            <History className="h-4 w-4" />
            Record History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6 outline-none">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-primary/5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Reviews</p>
                    <p className="text-3xl font-black mt-1">{stats?.totalEvaluations || 0}</p>
                  </div>
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Add more cards if needed */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <Card className="col-span-4 border-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Department Benchmarks</CardTitle>
                    <CardDescription>Average performance scores across sectors.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.averageByDept || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      />
                      <Bar dataKey="average" radius={[6, 6, 0, 0]} barSize={40}>
                        {(stats?.averageByDept || []).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3 border-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Lead Performers</CardTitle>
                    <CardDescription>Personnel with highest assessment ratings.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-1">
                  {stats?.topPerformers?.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-all group">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-60">Performance Leader</p>
                      </div>
                      <div className="text-lg font-black text-primary">
                        {p.score}%
                      </div>
                    </div>
                  ))}
                  {(!stats?.topPerformers || stats.topPerformers.length === 0) && (
                    <div className="py-20 text-center text-sm text-muted-foreground italic border-2 border-dashed rounded-xl">
                      No data insights available yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="outline-none">
          <Card className="border-primary/5">
            <CardContent className="p-0">
              <GenericDataTable
                columns={listColumns}
                data={evaluations}
                searchOptions={[
                  { id: "evaluatee", label: "Personnel Name" },
                  { id: "evaluator", label: "Assessor" },
                  { id: "type", label: "Category" }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showForm && <EvaluationForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
