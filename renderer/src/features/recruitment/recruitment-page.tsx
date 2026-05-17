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
        </div>
      )
    }
  ], [statusMutation, user])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recruitment Pipeline</h1>
        <div className="flex items-center space-x-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="h-7 px-4">Kanban</TabsTrigger>
              <TabsTrigger value="list" className="h-7 px-4">List</TabsTrigger>
            </TabsList>
          </Tabs>
          {user?.role === 'Admin' && (
            <Button onClick={() => setShowForm(true)}>New Candidate</Button>
          )}
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
    </div>
  )
}
