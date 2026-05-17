import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck2, ClipboardList, LineChart, BriefcaseBusiness, Search, MoveRight, CircleCheckBig, ShieldCheck } from 'lucide-react'
import { Area, Bar, BarChart, CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'

import { candidateService } from './candidate.service'
import type { Candidate } from './types'

const stageFlow = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'] as const

const stageAnalytics = [
  { stage: 'Applied', count: 186 },
  { stage: 'Screening', count: 74 },
  { stage: 'Interview', count: 28 },
  { stage: 'Offer', count: 9 },
  { stage: 'Hired', count: 5 },
]

const throughputTrend = [
  { week: 'W1', progress: 18, hired: 2 },
  { week: 'W2', progress: 27, hired: 3 },
  { week: 'W3', progress: 23, hired: 2 },
  { week: 'W4', progress: 31, hired: 5 },
]

function stageIndex(stage: Candidate['stage']) {
  return stageFlow.indexOf(stage as any)
}

function stageTone(stage: Candidate['stage']) {
  switch (stage) {
    case 'Applied':
      return 'secondary'
    case 'Screening':
      return 'outline'
    case 'Interview':
      return 'default'
    case 'Offer':
      return 'secondary'
    case 'Hired':
      return 'default'
    case 'Rejected':
      return 'outline'
    default:
      return 'outline'
  }
}

export function RecruitmentPage() {
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [stageFilter, setStageFilter] = React.useState<string>('')
  const [recruiterFilter, setRecruiterFilter] = React.useState<string>('')

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => candidateService.listCandidates(),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: any) => candidateService.updateCandidate(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })
  

  function acceptCandidate(id: number) {
    const c = candidates.find((c) => c.id === id)
    if (!c) return
    const nextStage = stageFlow[Math.min(stageIndex(c.stage), stageFlow.length - 1) + 1] ?? 'Hired'
    const patch: any = { stage: nextStage, lastUpdate: `Moved to ${nextStage}` }
    if (nextStage === 'Hired') patch.status = 'closed'
    updateMut.mutate({ id, patch })
  }

  function rejectCandidate(id: number) {
    updateMut.mutate({ id, patch: { status: 'closed', stage: 'Rejected', lastUpdate: 'Candidate rejected' } })
  }

  function advanceCandidate(id: number) {
    acceptCandidate(id)
  }

  const activeCandidates = candidates.filter((candidate) => candidate.status === 'active')
  const acceptedCandidates = candidates.filter((candidate) => candidate.stage === 'Hired')
  const rejectedCandidates = candidates.filter((candidate) => candidate.stage === 'Rejected')

  const recruiters = React.useMemo(() => Array.from(new Set(candidates.map((c) => c.recruiter).filter(Boolean))), [candidates])

  const filteredCandidates = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return candidates.filter((c) => {
      if (stageFilter && c.stage !== stageFilter) return false
      if (recruiterFilter && c.recruiter !== recruiterFilter) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q)
      )
    })
  }, [candidates, searchTerm, stageFilter, recruiterFilter])

  const analytics = React.useMemo(() => {
    const offerAcceptanceRate = Math.round((acceptedCandidates.length / Math.max(stageAnalytics[3].count, 1)) * 100)
    const conversionRate = Math.round((acceptedCandidates.length / Math.max(stageAnalytics[0].count, 1)) * 100)
    return { offerAcceptanceRate, conversionRate }
  }, [acceptedCandidates.length])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 pt-0">
      <Card className="overflow-hidden border-border/60">
        <CardHeader className="gap-4 border-b pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="size-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Recruitment pipeline</span>
              </div>
              <CardTitle className="text-3xl">Stage setup, hiring actions, and candidate progress</CardTitle>
              <CardDescription className="max-w-2xl text-base">Manage recruiting stages, accept or reject candidates in one workflow, and track movement from application to hire.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                <CalendarCheck2 className="size-3.5" />
                {activeCandidates.length} active jobs
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-muted-foreground">{acceptedCandidates.length} hires this period</Badge>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-4">
            <Card>
              <CardHeader>
                <CardDescription>Open candidates</CardDescription>
                <CardTitle className="text-2xl">{activeCandidates.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Accepted into next stage</CardDescription>
                <CardTitle className="text-2xl">{acceptedCandidates.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Rejected candidates</CardDescription>
                <CardTitle className="text-2xl">{rejectedCandidates.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Offer acceptance</CardDescription>
                <CardTitle className="text-2xl">{analytics.offerAcceptanceRate}%</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="size-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Recruitment stages</CardTitle>
                <CardDescription>Configured stages, owners, and service-level targets for the pipeline.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stageFlow.map((s, i) => (
              <div key={s} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s}</p>
                    <p className="text-sm text-muted-foreground">Stage {i + 1}</p>
                  </div>
                  <Badge variant="outline">Owner</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LineChart className="size-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Recruitment analytics</CardTitle>
                <CardDescription>Stage volume, hiring throughput, and source mix across the funnel.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ChartContainer config={{ count: { label: 'Candidates' } }} className="aspect-auto h-72 w-full">
              <BarChart data={stageAnalytics} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" tickLine={false} axisLine={false} width={92} />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ChartContainer>
            <ChartContainer config={{ progress: { label: 'Progress' } }} className="aspect-auto h-64 w-full">
              <RechartsLineChart data={throughputTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="progress" type="monotone" fill="url(#fillPipeline)" stroke="var(--color-progress)" strokeWidth={2.5} />
                <Line dataKey="hired" type="monotone" stroke="var(--color-hired)" strokeWidth={2.5} dot={false} />
              </RechartsLineChart>
            </ChartContainer>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Time to hire</p>
                <p className="mt-1 text-2xl font-semibold">26 days</p>
                <p className="text-sm text-emerald-600">2 days faster than last month</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Source quality</p>
                <p className="mt-1 text-2xl font-semibold">82%</p>
                <p className="text-sm text-primary">Referrals lead the funnel</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Drop-off</p>
                <p className="mt-1 text-2xl font-semibold">14%</p>
                <p className="text-sm text-amber-600">Highest between screening and interview</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Candidate sources</p>
                    <p className="text-sm text-muted-foreground">Pipeline source mix and referral strength.</p>
                  </div>
                  <BriefcaseBusiness className="size-4 text-muted-foreground" />
                </div>
              </div>
              <div className="rounded-xl border p-3">
                <p className="font-medium">Workflow signals</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Interview slots filled</span>
                    <span className="font-semibold">91%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Offer backlog</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Hiring manager SLA</span>
                    <span className="font-semibold text-emerald-600">On track</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="size-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Candidate workflow</CardTitle>
                <CardDescription>Accept, reject, or advance applicants through the next recruiting stage.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search candidates, role, source" className="h-9" />
                <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="rounded-md border px-2 py-1">
                  <option value="">All stages</option>
                  {stageFlow.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)} className="rounded-md border px-2 py-1">
                  <option value="">All recruiters</option>
                  {recruiters.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Link to="/dashboard/recruitment/candidates/new">
                  <Button size="sm">New candidate</Button>
                </Link>
              </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <Link to={`/dashboard/recruitment/candidates/${candidate.id}`} className="text-left font-medium hover:underline">{candidate.name}</Link>
                          <p className="text-sm text-muted-foreground">{candidate.source} · {candidate.recruiter}</p>
                        </TableCell>
                        <TableCell>{candidate.role}</TableCell>
                        <TableCell>
                          <Badge variant={stageTone(candidate.stage)}>{candidate.stage}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums">{candidate.score}</TableCell>
                        <TableCell>
                          {candidate.status === 'active' ? (
                            <div className="flex flex-wrap gap-2 items-center">
                              <Button size="sm" onClick={() => acceptCandidate(candidate.id)}>Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => advanceCandidate(candidate.id)}>Advance</Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectCandidate(candidate.id)}>Reject</Button>
                              <select defaultValue={candidate.recruiter} onChange={(e) => updateMut.mutate({ id: candidate.id, patch: { recruiter: e.target.value } })} className="rounded-md border px-2 py-1">
                                <option value="">Unassigned</option>
                                {recruiters.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <Link to={`/dashboard/recruitment/candidates/${candidate.id}/edit`}>
                                <Button size="sm" variant="ghost">Edit</Button>
                              </Link>
                            </div>
                          ) : (
                            <Badge variant="outline" className="gap-1"><CircleCheckBig className="size-3.5" /> Closed</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="active" className="space-y-3">
                {filteredCandidates.filter((candidate) => candidate.status === 'active').map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Link to={`/dashboard/recruitment/candidates/${candidate.id}`} className="font-medium hover:underline">{candidate.name}</Link>
                        <p className="text-sm text-muted-foreground">{candidate.role}</p>
                      </div>
                      <Badge variant={stageTone(candidate.stage)}>{candidate.stage}</Badge>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="closed" className="space-y-3">
                {filteredCandidates.filter((candidate) => candidate.status === 'closed').map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Link to={`/dashboard/recruitment/candidates/${candidate.id}`} className="font-medium hover:underline">{candidate.name}</Link>
                        <p className="text-sm text-muted-foreground">{candidate.role}</p>
                      </div>
                      <Badge variant="outline">{candidate.stage}</Badge>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MoveRight className="size-5" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">Candidate progression tracking</CardTitle>
                <CardDescription>Inspect the selected candidate’s path through the pipeline.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Select a candidate to see details</p>
                  <p className="text-sm text-muted-foreground">Click a name in the list</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

