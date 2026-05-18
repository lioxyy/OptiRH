import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Card } from '../../components/ui/card'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { CandidateForm } from './candidate-form'
import { InterviewForm } from './interview-form'
import { InterviewResultForm } from './interview-result-form'
import { HireDialog } from './hire-dialog'
import { Calendar, ClipboardCheck, UserPlus, MoreHorizontal, Plus, Tag, Mail, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { format } from 'date-fns'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

const statusColumns = [
  { id: 'Pending', label: 'Candidates' },
  { id: 'In Progress', label: 'Scheduled Interviews' },
  { id: 'Accepted', label: 'Qualified' },
  { id: 'Rejected', label: 'Disqualified' },
] as const

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Pending: 'secondary',
  'In Progress': 'default',
  Accepted: 'outline',
  Rejected: 'destructive',
  Hired: 'default',
}

function CandidateCard({
  candidate,
  isOverlay = false,
  onSchedule,
  onResult,
  onHire
}: {
  candidate: Candidate;
  isOverlay?: boolean;
  onSchedule: (c: Candidate) => void;
  onResult: (c: Candidate) => void;
  onHire: (c: Candidate) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: candidate.id_cand,
    data: {
      type: 'Candidate',
      candidate,
    },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 h-[120px] rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 mb-3"
      />
    )
  }

  const activeInterview = candidate.entretiens?.find(i => i.status === 'Scheduled')
  const score = candidate.evaluations?.[0]?.score

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative p-4 bg-muted/40 dark:bg-[#18181b] border-none hover:bg-muted/60 dark:hover:bg-[#222226] transition-all cursor-grab active:cursor-grabbing rounded-2xl shadow-sm mb-3",
        isOverlay && "cursor-grabbing shadow-2xl scale-105 ring-2 ring-primary/20 bg-muted/80 dark:bg-[#1e1e21]"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="font-bold text-[13px] text-foreground/90">{candidate.name}</p>
            {candidate.post_applied && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-medium">
                <Tag className="h-3 w-3 opacity-50" />
                {candidate.post_applied}
              </div>
            )}
          </div>
          {score !== undefined && (
            <div className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold",
              score >= 70 ? "bg-green-500/10 text-green-500" : score >= 40 ? "bg-orange-500/10 text-orange-500" : "bg-red-500/10 text-red-500"
            )}>
              {score}%
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
            <Mail className="h-3 w-3" />
            {candidate.email}
          </div>
          {activeInterview && (
            <div className="flex items-center gap-2 text-[10px] text-blue-500 font-bold bg-blue-500/10 w-fit px-2 py-0.5 rounded">
              <Calendar className="h-3 w-3" />
              {format(new Date(activeInterview.date_heure), 'MMM dd, HH:mm')}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tight">
            <User className="h-2.5 w-2.5" />
            {candidate.agent?.name || 'Unassigned'}
          </div>
          <div className="flex gap-1 no-drag">
            {candidate.status === 'Pending' && (
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted/30" onPointerDown={e => e.stopPropagation()} onClick={() => onSchedule(candidate)}>
                <UserPlus className="h-3 w-3" />
              </Button>
            )}
            {candidate.status === 'Accepted' && (
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-green-500/20 text-green-600" onPointerDown={e => e.stopPropagation()} onClick={() => onHire(candidate)}>
                <UserPlus className="h-3 w-3" />
              </Button>
            )}
            {activeInterview && (
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted/30" onPointerDown={e => e.stopPropagation()} onClick={() => onResult(candidate)}>
                <ClipboardCheck className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted/30" onPointerDown={e => e.stopPropagation()} onClick={() => onSchedule(candidate)}>
              <Calendar className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function RecruitmentColumn({ status, label, candidates, onSchedule, onResult, onHire }: {
  status: string;
  label: string;
  candidates: Candidate[];
  onSchedule: (c: Candidate) => void;
  onResult: (c: Candidate) => void;
  onHire: (c: Candidate) => void;
}) {
  const { setNodeRef } = useSortable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight text-foreground/80">{label}</h3>
          <span className="text-xs text-muted-foreground/40 font-bold ml-1">{candidates.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/30 hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col min-h-[500px]"
      >
        <SortableContext items={candidates.map(c => c.id_cand)} strategy={verticalListSortingStrategy}>
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id_cand}
              candidate={candidate}
              onSchedule={onSchedule}
              onResult={onResult}
              onHire={onHire}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export function RecruitmentPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Candidate') {
      setActiveCandidate(event.active.data.current.candidate)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCandidate(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData || activeData.type !== 'Candidate') return

    const candidate = activeData.candidate
    let newStatus = candidate.status

    if (overData?.type === "Column") {
      newStatus = overData.status
    } else if (overData?.type === "Candidate") {
      newStatus = overData.candidate.status
    }

    if (newStatus !== candidate.status) {
      statusMutation.mutate({ id: candidate.id_cand, status: newStatus })
    }
  }

  const listColumns = React.useMemo<ColumnDef<Candidate>[]>(() => [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidate" />,
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applied On" />,
      cell: ({ row }) => format(new Date(row.original.date_candidature), 'MMM dd, yyyy'),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSchedulingCandidate(row.original)}>Schedule</Button>
          {row.original.status === 'Accepted' && (
            <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => setHiringCandidate(row.original)}>
              Hire
            </Button>
          )}
        </div>
      )
    }
  ], [])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Recruitment Pipeline</h1>
          <p className="text-sm text-muted-foreground font-medium">Track and manage candidates through the hiring workflow.</p>
        </div>
        {user?.role === 'Admin' && (
          <Button size="sm" onClick={() => setShowForm(true)} className="h-9 px-6 rounded-xl text-xs font-bold shadow-lg">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Candidate
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 bg-muted/20 p-1 rounded-xl border border-muted-foreground/5 w-fit">
        <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')} className="w-fit">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger
              value="kanban"
              className="h-7 px-4 rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              Kanban View
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="h-7 px-4 rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              Table List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
            {statusColumns.map((col) => (
              <RecruitmentColumn
                key={col.id}
                status={col.id}
                label={col.label}
                candidates={candidates.filter((c) => c.status === col.id)}
                onSchedule={setSchedulingCandidate}
                onResult={(c) => {
                  const interview = c.entretiens?.find(i => i.status === 'Scheduled')
                  if (interview) setResultInterview({ id: interview.id_entretien, name: c.name })
                }}
                onHire={setHiringCandidate}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
          }}>
            {activeCandidate ? (
              <CandidateCard
                candidate={activeCandidate}
                isOverlay
                onSchedule={() => { }}
                onResult={() => { }}
                onHire={() => { }}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <GenericDataTable
          columns={listColumns}
          data={candidates}
          searchOptions={[
            { id: "name", label: "Candidate Name" },
            { id: "email", label: "Email" },
            { id: "position", label: "Position" },
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
