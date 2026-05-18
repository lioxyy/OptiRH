import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { CandidateForm } from './candidate-form'
import { InterviewForm } from './interview-form'
import { InterviewResultForm } from './interview-result-form'
import { HireDialog } from './hire-dialog'
import { Calendar, ClipboardCheck, Star, UserPlus } from 'lucide-react'

interface Interview {
  id_entretien: number
  date_heure: string
  status: string
  result_notes?: string | null
  agent?: { name: string }
}

interface Candidate {
  id_cand: number
  name: string
  email: string
  post_applied?: string | null
  status: string
  date_candidature: string
  agent?: { name: string } | null
  entretiens?: Interview[]
  evaluations?: { score: number }[]
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Pending: 'secondary',
  'In Progress': 'default',
  Accepted: 'outline',
  Rejected: 'destructive',
  Hired: 'default',
}

export function RecruitmentPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null)
  const [resultInterview, setResultInterview] = useState<{ id: number; name: string } | null>(null)
  const [hiringCandidate, setHiringCandidate] = useState<Candidate | null>(null)

  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ['recruitment'],
    queryFn: async () => {
      const res = await api.get('/api/recruitment')
      return res.data.data
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/api/recruitment/${id}/status`, { status })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruitment'] }),
  })



  const columns = [
    { status: 'Pending', label: 'New Applications' },
    { status: 'In Progress', label: 'In Review' },
    { status: 'Accepted', label: 'Accepted' },
    { status: 'Rejected', label: 'Rejected' },
  ]

  const listColumns = React.useMemo<ColumnDef<Candidate>[]>(() => [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      id: "position",
      accessorFn: (row) => row.post_applied || '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <Badge variant={statusVariant[row.original.status] ?? 'outline'}>{row.original.status}</Badge>
    },
    {
      id: "agent",
      accessorFn: (row) => row.agent?.name || '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Agent" />,
    },
    {
      id: "date",
      accessorKey: "date_candidature",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => new Date(row.original.date_candidature).toLocaleDateString(),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1">
          {row.original.status === 'Pending' && (
            <Button size="sm" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: row.original.id_cand, status: 'In Progress' })}>Review</Button>
          )}
          {row.original.status === 'In Progress' && user?.role === 'Admin' && (
            <>
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: row.original.id_cand, status: 'Accepted' })}>Accept</Button>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: row.original.id_cand, status: 'Rejected' })}>Reject</Button>
            </>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSchedulingCandidate(row.original)}>Schedule</Button>
          {row.original.entretiens?.find(i => i.status === 'Scheduled') && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
              const interview = row.original.entretiens!.find(i => i.status === 'Scheduled')!
              setResultInterview({ id: interview.id_entretien, name: row.original.name })
            }}>Result</Button>
          )}
          {row.original.status === 'Accepted' && (
            <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => setHiringCandidate(row.original)}>
              <UserPlus className="mr-1 h-3 w-3" /> Hire
            </Button>
          )}
        </div>
      )
    }
  ], [statusMutation, user])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Recruitment Pipeline</h1>
          {user?.role === 'Admin' && (
            <Button onClick={() => setShowForm(true)}>New Candidate</Button>
          )}
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')} className="w-fit">
          <TabsList className="h-9">
            <TabsTrigger value="kanban" className="h-7 px-4">Kanban</TabsTrigger>
            <TabsTrigger value="list" className="h-7 px-4">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-4 gap-4">
          {columns.map(({ status, label }) => {
            const columnCandidates = candidates.filter((c) => c.status === status)
            return (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {label}
                    <Badge variant="secondary">{columnCandidates.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[200px]">
                  {columnCandidates.map((candidate) => (
                    <Card key={candidate.id_cand} className="p-3">
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{candidate.name}</p>
                        {candidate.post_applied && (
                          <p className="text-xs text-muted-foreground">{candidate.post_applied}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{candidate.agent?.name && `Agent: ${candidate.agent.name}`}</p>

                        {/* Interview & Score Info */}
                        {candidate.entretiens?.some(i => i.status === 'Scheduled') && (
                          <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-medium bg-blue-50 p-1 rounded">
                            <Calendar className="h-3 w-3" />
                            {new Date(candidate.entretiens.find(i => i.status === 'Scheduled')!.date_heure).toLocaleDateString()}
                          </div>
                        )}
                        {candidate.evaluations && candidate.evaluations.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold bg-amber-50 p-1 rounded">
                            <Star className="h-3 w-3 fill-amber-600" />
                            Score: {candidate.evaluations[0].score}/100
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 pt-1">
                          {status === 'Pending' && (
                            <Button size="sm" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: candidate.id_cand, status: 'In Progress' })}>
                              Review
                            </Button>
                          )}
                          {status === 'In Progress' && user?.role === 'Admin' && (
                            <>
                              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: candidate.id_cand, status: 'Accepted' })}>
                                Accept
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: candidate.id_cand, status: 'Rejected' })}>
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs flex-1 border border-input hover:bg-accent" onClick={() => setSchedulingCandidate(candidate)}>
                            <Calendar className="mr-1 h-3 w-3" /> Schedule
                          </Button>
                          {candidate.entretiens?.find(i => i.status === 'Scheduled') && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs flex-1 border border-input hover:bg-accent" onClick={() => {
                              const interview = candidate.entretiens!.find(i => i.status === 'Scheduled')!
                              setResultInterview({ id: interview.id_entretien, name: candidate.name })
                            }}>
                              <ClipboardCheck className="mr-1 h-3 w-3" /> Result
                            </Button>
                          )}
                          {status === 'Accepted' && (
                            <Button size="sm" className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700" onClick={() => setHiringCandidate(candidate)}>
                              <UserPlus className="mr-1 h-3 w-3" /> Hire
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  {columnCandidates.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No candidates</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <GenericDataTable
          columns={listColumns}
          data={candidates}
          searchOptions={[
            { id: "name", label: "Candidate Name" },
            { id: "email", label: "Email" },
            { id: "position", label: "Position" },
            { id: "status", label: "Status" }
          ]}
        />
      )}

      {showForm && <CandidateForm onClose={() => setShowForm(false)} />}

      {schedulingCandidate && (
        <InterviewForm
          candidateId={schedulingCandidate.id_cand}
          candidateName={schedulingCandidate.name}
          onClose={() => setSchedulingCandidate(null)}
        />
      )}

      {resultInterview && (
        <InterviewResultForm
          interviewId={resultInterview.id}
          candidateName={resultInterview.name}
          onClose={() => setResultInterview(null)}
        />
      )}

      {hiringCandidate && (
        <HireDialog
          candidate={hiringCandidate}
          onClose={() => setHiringCandidate(null)}
          onSuccess={() => {
            statusMutation.mutate({ id: hiringCandidate.id_cand, status: 'Hired' })
            queryClient.invalidateQueries({ queryKey: ['recruitment'] })
            queryClient.invalidateQueries({ queryKey: ['employees'] })
          }}
        />
      )}
    </div>
  )
}
