import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Calendar, Mail, Phone, User, Users, X } from 'lucide-react'

import { agentsService } from './agents.service'
import type { Department } from './types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AgentDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedDept, setSelectedDept] = React.useState<string>('')
  const [selectedMember, setSelectedMember] = React.useState<string>('')

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', numericId],
    queryFn: () => agentsService.getAgent(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
  })

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: () => agentsService.listDepartments(),
  })

  const { data: allEmployees = [] } = useQuery<{ id_emp: number; name: string; role: string }[]>({
    queryKey: ['employees'],
    queryFn: () => agentsService.listAllEmployees(),
  })

  React.useEffect(() => {
    if (agent) setSelectedDept(String(agent.id_dept))
  }, [agent])

  const deptMut = useMutation({
    mutationFn: (id_dept: number) => agentsService.changeAgentDepartment(numericId, id_dept),
    onSuccess: () => {
      toast.success('Department updated')
      queryClient.invalidateQueries({ queryKey: ['agent', numericId] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
    onError: () => toast.error('Failed to update department'),
  })

  const addMemberMut = useMutation({
    mutationFn: (emp_id: number) => agentsService.assignTeamMember(numericId, emp_id),
    onSuccess: () => {
      toast.success('Team member added')
      setSelectedMember('')
      queryClient.invalidateQueries({ queryKey: ['agent', numericId] })
    },
    onError: () => toast.error('Failed to add team member'),
  })

  const removeMemberMut = useMutation({
    mutationFn: (empId: number) => agentsService.removeTeamMember(numericId, empId),
    onSuccess: () => {
      toast.success('Team member removed')
      queryClient.invalidateQueries({ queryKey: ['agent', numericId] })
    },
    onError: () => toast.error('Failed to remove team member'),
  })

  const deleteMut = useMutation({
    mutationFn: () => agentsService.deleteAgent(numericId),
    onSuccess: () => {
      toast.success('Agent deleted')
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      navigate('/dashboard/agents')
    },
    onError: () => toast.error('Failed to delete agent'),
  })

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!agent) return <div className="p-6">Agent not found</div>

  const currentTeamIds = new Set((agent.subordinates ?? []).map((s) => s.id_emp))
  const availableToAdd = allEmployees.filter(
    (e) => e.id_emp !== numericId && !currentTeamIds.has(e.id_emp),
  )
  const deptChanged = selectedDept && selectedDept !== String(agent.id_dept)

  return (
    <div className="space-y-6 p-4 pt-0">
      {/* Profile header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{agent.name}</h2>
                <p className="text-sm text-muted-foreground">{agent.email}</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to={`/dashboard/agents/${numericId}/edit`}>Edit profile</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <InfoItem icon={<Building2 className="size-4" />} label="Department">
              {agent.department?.name ?? '—'}
            </InfoItem>
            <InfoItem icon={<Mail className="size-4" />} label="Email">
              <span className="truncate">{agent.email}</span>
            </InfoItem>
            <InfoItem icon={<Phone className="size-4" />} label="Phone">
              {agent.phone || '—'}
            </InfoItem>
            <InfoItem icon={<Users className="size-4" />} label="Team size">
              {agent.subordinates?.length ?? 0} member{(agent.subordinates?.length ?? 0) !== 1 ? 's' : ''}
            </InfoItem>
            <InfoItem icon={<Calendar className="size-4" />} label="Date of birth">
              {agent.date_birth ? new Date(agent.date_birth).toLocaleDateString() : '—'}
            </InfoItem>
            <InfoItem icon={<Calendar className="size-4" />} label="Employment date">
              {agent.date_employment ? new Date(agent.date_employment).toLocaleDateString() : '—'}
            </InfoItem>
            {agent.supervisor && (
              <InfoItem icon={<User className="size-4" />} label="Supervisor">
                {agent.supervisor.name}
              </InfoItem>
            )}
            {agent.gender && (
              <InfoItem icon={<User className="size-4" />} label="Gender">
                {agent.gender}
              </InfoItem>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Department assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              Department
            </CardTitle>
            <CardDescription>Change the agent's department assignment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Current department</p>
              <Badge variant="outline">{agent.department?.name ?? 'None'}</Badge>
            </div>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id_dept} value={String(d.id_dept)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => deptMut.mutate(Number(selectedDept))}
              disabled={deptMut.isPending || !deptChanged}
            >
              {deptMut.isPending ? 'Saving...' : 'Apply'}
            </Button>
          </CardContent>
        </Card>

        {/* Team management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              Team members
            </CardTitle>
            <CardDescription>Add or remove employees reporting to this agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add member */}
            <div className="flex gap-2">
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select employee to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.length === 0 ? (
                    <SelectItem value="__none__" disabled>No employees available</SelectItem>
                  ) : (
                    availableToAdd.map((e) => (
                      <SelectItem key={e.id_emp} value={String(e.id_emp)}>
                        {e.name}
                        <span className="ml-1 text-xs text-muted-foreground">({e.role})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (!selectedMember) return
                  addMemberMut.mutate(Number(selectedMember))
                }}
                disabled={!selectedMember || addMemberMut.isPending}
              >
                Add
              </Button>
            </div>

            {/* Member list */}
            {(agent.subordinates?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No team members assigned.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {agent.subordinates!.map((member) => (
                  <li key={member.id_emp} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMemberMut.mutate(member.id_emp)}
                        disabled={removeMemberMut.isPending}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Permanent actions that cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Delete this agent</p>
              <p className="text-sm text-muted-foreground">
                Permanently removes the agent account and unlinks all team members.
              </p>
            </div>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (!confirm(`Delete ${agent.name}? This cannot be undone.`)) return
                deleteMut.mutate()
              }}
            >
              {deleteMut.isPending ? 'Deleting...' : 'Delete agent'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}
