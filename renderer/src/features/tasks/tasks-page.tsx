import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
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

  if (isLoading) return <div className="p-6">Loading...</div>

  const groupedTasks = columns.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <Button
              variant={view === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setView('kanban')}
            >
              Kanban
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setView('list')}
            >
              List
            </Button>
          </div>
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
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-sm">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Assignee</th>
                  <th className="text-left p-3 font-medium">Priority</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Due Date</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id_task} className="border-b last:border-0">
                    <td className="p-3 text-sm font-medium">{task.name}</td>
                    <td className="p-3 text-sm">{task.assignee?.name}</td>
                    <td className="p-3">
                      <Badge variant={priorityVariant[task.priority] ?? 'default'} className="text-[10px]">
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{task.status}</td>
                    <td className="p-3 text-sm">{new Date(task.date_fin).toLocaleDateString()}</td>
                    <td className="p-3 text-right space-x-1">
                      {task.status !== 'Done' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => updateMutation.mutate({
                            id: task.id_task,
                            status: task.status === 'To Do' ? 'Doing' : 'Done',
                          })}>
                          {task.status === 'To Do' ? 'Start' : 'Complete'}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                        onClick={() => { if (confirm('Delete task?')) deleteMutation.mutate(task.id_task) }}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
