import * as React from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Plus, Users } from 'lucide-react'

import { agentsService } from './agents.service'
import type { Department } from './types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AgentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [deptFilter, setDeptFilter] = React.useState<string>('all')

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsService.listAgents(),
  })

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => agentsService.listDepartments(),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => agentsService.deleteAgent(id),
    onSuccess: () => {
      toast.success('Agent deleted')
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
    onError: () => toast.error('Failed to delete agent'),
  })

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return agents.filter((a) => {
      if (deptFilter !== 'all' && String(a.id_dept) !== deptFilter) return false
      if (!q) return true
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.department?.name ?? '').toLowerCase().includes(q)
      )
    })
  }, [agents, search, deptFilter])

  const stats = React.useMemo(() => {
    const byDept: Record<string, number> = {}
    for (const a of agents) {
      const key = a.department?.name ?? 'Unassigned'
      byDept[key] = (byDept[key] ?? 0) + 1
    }
    return {
      total: agents.length,
      withTeam: agents.filter((a) => (a.subordinates?.length ?? 0) > 0).length,
      byDept,
    }
  }, [agents])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6 p-4 pt-0">
      {/* Header + stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Agents</CardTitle>
              <CardDescription>Manage agents, their department links, and team assignments.</CardDescription>
            </div>
            <Button asChild>
              <Link to="/dashboard/agents/new">
                <Plus className="mr-2 size-4" />
                New agent
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <StatCard title="Total agents" value={stats.total} icon={<Users className="size-4" />} />
            <StatCard title="With team members" value={stats.withTeam} icon={<Users className="size-4" />} />
            {Object.entries(stats.byDept)
              .slice(0, 2)
              .map(([dept, count]) => (
                <StatCard key={dept} title={dept} value={count} icon={<Building2 className="size-4" />} />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters + table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department"
            />
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id_dept} value={String(d.id_dept)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No agents found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((agent) => (
                <TableRow key={agent.id_emp}>
                  <TableCell>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">{agent.email}</div>
                  </TableCell>
                  <TableCell>
                    {agent.department
                      ? <Badge variant="outline">{agent.department.name}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {agent.subordinates?.length ?? 0} member{(agent.subordinates?.length ?? 0) !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {agent.supervisor?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/dashboard/agents/${agent.id_emp}`}>View</Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/dashboard/agents/${agent.id_emp}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMut.mutate(agent.id_emp)}
                        disabled={deleteMut.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  )
}
