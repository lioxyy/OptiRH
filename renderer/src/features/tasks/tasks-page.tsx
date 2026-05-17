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
import { TaskForm } from './task-form'

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

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  Low: 'secondary',
  Medium: 'default',
  High: 'destructive',
}

const columns = ['To Do', 'Doing', 'Done'] as const

export function TasksPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

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



  const groupedTasks = columns.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  }))

  const listColumns = React.useMemo<ColumnDef<Task>[]>(() => [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
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
        <Badge variant={priorityVariant[row.original.priority] ?? 'default'} className="text-[10px]">
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
      cell: ({ row }) => new Date(row.original.date_fin).toLocaleDateString(),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end space-x-1">
          {row.original.status !== 'Done' && (
            <Button size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => updateMutation.mutate({
                id: row.original.id_task,
                status: row.original.status === 'To Do' ? 'Doing' : 'Done',
              })}>
              {row.original.status === 'To Do' ? 'Start' : 'Complete'}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
            onClick={() => { if (confirm('Delete task?')) deleteMutation.mutate(row.original.id_task) }}>
            Delete
          </Button>
        </div>
      )
    }
  ], [updateMutation, deleteMutation])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks Board</h1>
        <div className="flex items-center space-x-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')} className="w-auto">
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="h-7 px-4">Kanban</TabsTrigger>
              <TabsTrigger value="list" className="h-7 px-4">List</TabsTrigger>
            </TabsList>
          </Tabs>
          {(user?.role === 'Admin' || user?.role === 'Agent') && (
            <Button onClick={() => setShowForm(true)}>New Task</Button>
          )}
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-3 gap-4">
          {groupedTasks.map(({ status, tasks: columnTasks }) => (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {status}
                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[200px]">
                {columnTasks.map((task) => (
                  <Card key={task.id_task} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm">{task.name}</p>
                        <Badge variant={priorityVariant[task.priority] ?? 'default'} className="text-[10px] px-1.5">
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{task.assignee?.name || 'Unassigned'}</span>
                        <span>{new Date(task.date_fin).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1 pt-1">
                        {status === 'To Do' && (
                          <Button size="sm" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: task.id_task, status: 'Doing' })}>
                            Start
                          </Button>
                        )}
                        {status === 'Doing' && (
                          <Button size="sm" className="h-7 text-xs" onClick={() => updateMutation.mutate({ id: task.id_task, status: 'Done' })}>
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto text-destructive"
                          onClick={() => { if (confirm('Delete task?')) deleteMutation.mutate(task.id_task) }}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {columnTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <GenericDataTable
          columns={listColumns}
          data={tasks}
          searchOptions={[
            { id: "name", label: "Task Name" },
            { id: "assignee", label: "Assignee Name" },
            { id: "priority", label: "Priority" },
            { id: "status", label: "Status" }
          ]}
        />
      )}

      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
