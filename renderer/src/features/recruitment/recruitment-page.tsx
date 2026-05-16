import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { CandidateForm } from './candidate-form'

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
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Pending: 'secondary',
  'In Progress': 'default',
  Accepted: 'outline',
  Rejected: 'destructive',
}

export function RecruitmentPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

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

  if (isLoading) return <div className="p-6">Loading...</div>

  const columns = [
    { status: 'Pending', label: 'New Applications' },
    { status: 'In Progress', label: 'In Review' },
    { status: 'Accepted', label: 'Accepted' },
    { status: 'Rejected', label: 'Rejected' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recruitment</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setView('kanban')}>Kanban</Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setView('list')}>List</Button>
          </div>
          <Button onClick={() => setShowForm(true)}>Add Candidate</Button>
        </div>
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
                        <div className="flex gap-1 pt-1">
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
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Position</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Agent</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id_cand} className="border-b last:border-0">
                    <td className="p-3 text-sm font-medium">{candidate.name}</td>
                    <td className="p-3 text-sm">{candidate.email}</td>
                    <td className="p-3 text-sm">{candidate.post_applied || '—'}</td>
                    <td className="p-3"><Badge variant={statusVariant[candidate.status] ?? 'outline'}>{candidate.status}</Badge></td>
                    <td className="p-3 text-sm">{candidate.agent?.name || '—'}</td>
                    <td className="p-3 text-sm">{new Date(candidate.date_candidature).toLocaleDateString()}</td>
                    <td className="p-3 text-right space-x-1">
                      {candidate.status === 'Pending' && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: candidate.id_cand, status: 'In Progress' })}>Review</Button>
                      )}
                      {candidate.status === 'In Progress' && user?.role === 'Admin' && (
                        <>
                          <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: candidate.id_cand, status: 'Accepted' })}>Accept</Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: candidate.id_cand, status: 'Rejected' })}>Reject</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {showForm && <CandidateForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
