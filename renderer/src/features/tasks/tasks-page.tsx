import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Card, CardContent } from '../../components/ui/card'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { Checkbox } from '../../components/ui/checkbox'
import { TaskForm } from './task-form'
import { AlertCircle, Clock, Trash2, MoreHorizontal, Plus } from 'lucide-react'
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
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Task {
  id_task: number
  name: string
  description?: string | null
  priority: string
  status: string
  date_deb: string
  date_fin: string
  assigned_to: number
  assigned_by: number
  creator?: { name: string }
  assignee?: { name: string }
}

const statusColumns = ['To Do', 'Doing', 'Done'] as const

const priorityColors: Record<string, string> = {
  Low: 'border-blue-500',
  Medium: 'border-orange-500',
  High: 'border-red-500',
}

const priorityBg: Record<string, string> = {
  Low: 'bg-blue-500/10',
  Medium: 'bg-orange-500/10',
  High: 'bg-red-500/10',
}

const tablePriorityVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Low: 'secondary',
  Medium: 'default',
  High: 'destructive',
}

function TaskCard({ task, isOverlay = false }: { task: Task; isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id_task,
    data: {
      type: 'Task',
      task,
    },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  const urgency = getTaskUrgency(task)

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 h-[100px] rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 mb-3"
      />
    )
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative p-4 bg-muted/20 border-none hover:bg-muted/30 transition-all cursor-grab active:cursor-grabbing rounded-2xl shadow-sm mb-3",
        isOverlay && "cursor-grabbing shadow-2xl scale-105 ring-2 ring-primary/20",
        priorityBg[task.priority]
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-3.5 h-3.5 rounded-full border-2", priorityColors[task.priority])} />
          <p className="font-semibold text-[13px] text-foreground/90">{task.name}</p>
        </div>

        {task.description && (
          <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed pl-6">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pl-6 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded-md font-medium">
              {task.assignee?.name || 'Unassigned'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <Clock className="h-3 w-3" />
            {format(new Date(task.date_fin), 'MMM dd')}
          </div>
        </div>
      </div>
    </Card>
  )
}

function KanbanColumn({ status, tasks, onAddTask }: { status: string; tasks: Task[]; onAddTask: () => void }) {
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
          <h3 className="text-sm font-bold tracking-tight text-foreground/80 lowercase first-letter:uppercase">{status}</h3>
          <span className="text-xs text-muted-foreground/60 font-medium ml-1">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col min-h-[500px]"
      >
        <SortableContext items={tasks.map(t => t.id_task)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id_task} task={task} />
          ))}
        </SortableContext>

        <Button
          variant="ghost"
          className="justify-start gap-2 h-10 text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-xl"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4" />
          <span className="text-xs font-medium">Add task</span>
        </Button>
      </div>
    </div>
  )
}

function getTaskUrgency(task: Task) {
  if (task.status === 'Done') return null
  const now = new Date()
  const due = new Date(task.date_fin)
  const diff = due.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (diff < 0) return { label: 'Overdue', variant: 'destructive' as const, days }
  if (days <= 2) return { label: 'Due Soon', variant: 'default' as const, days }
  return { label: `${days}d left`, variant: 'secondary' as const, days }
}

export function TasksPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [rowSelection, setRowSelection] = useState({})
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await api.get('/api/tasks')
      return res.data.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/api/tasks/${id}`, { status })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/tasks/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => api.delete(`/api/tasks/${id}`)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setRowSelection({})
    },
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
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData || activeData.type !== 'Task') return

    const task = activeData.task
    let newStatus = task.status

    if (overData?.type === "Column") {
      newStatus = overData.status
    } else if (overData?.type === "Task") {
      newStatus = overData.task.status
    }

    if (newStatus !== task.status) {
      updateMutation.mutate({ id: task.id_task, status: newStatus })
    }
  }

  const listColumns = React.useMemo<ColumnDef<Task>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Task Name" />,
    },
    {
      id: "assignee",
      accessorFn: (row) => row.assignee?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ row }) => (
        <Badge variant={tablePriorityVariant[row.original.priority] ?? 'default'} className="text-[10px]">
          {row.original.priority}
        </Badge>
      )
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    },
    {
      id: "due_date",
      accessorKey: "date_fin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ row }) => format(new Date(row.original.date_fin), 'MMM dd, yyyy'),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
            onClick={() => { if (confirm('Delete task?')) deleteMutation.mutate(row.original.id_task) }}>
            Delete
          </Button>
        </div>
      )
    }
  ], [deleteMutation])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Project Tasks</h1>
          <p className="text-sm text-muted-foreground font-medium">Manage and track your operational activities.</p>
        </div>
        <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-xl border border-muted-foreground/10">
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')} className="w-fit">
            <TabsList className="h-8 bg-transparent">
              <TabsTrigger value="kanban" className="h-7 px-4 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Kanban View</TabsTrigger>
              <TabsTrigger value="list" className="h-7 px-4 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Table List</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="h-4 w-[1px] bg-muted-foreground/20" />
          <Button size="sm" onClick={() => setShowForm(true)} className="h-8 rounded-lg text-xs font-bold shadow-lg">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Task
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {statusColumns.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasks.filter((t) => t.status === status)}
                onAddTask={() => setShowForm(true)}
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
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="space-y-4">
          {Object.keys(rowSelection).length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-9 px-4 rounded-xl shadow-destructive/20 border-none"
              onClick={() => {
                const selectedIds = Object.keys(rowSelection).map(index => tasks[Number(index)].id_task)
                if (confirm(`Delete ${selectedIds.length} tasks?`)) {
                  bulkDeleteMutation.mutate(selectedIds)
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({Object.keys(rowSelection).length})
            </Button>
          )}
          <GenericDataTable
            columns={listColumns}
            data={tasks}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            searchOptions={[
              { id: "name", label: "Task Name" },
              { id: "assignee", label: "Assignee" },
            ]}
          />
        </div>
      )}

      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
