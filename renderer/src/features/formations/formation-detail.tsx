import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  assignInstructor,
  getFormation,
  getParticipants,
  listEmployees,
  scheduleFormation,
  addParticipant,
  removeParticipant,
} from './formation.service'
import type { EmployeeRef, Participant } from './types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Calendar, Clock, MapPin, User, Users, X } from 'lucide-react'

export default function FormationDetail() {
  const { id } = useParams()
  const numericId = Number(id)
  const queryClient = useQueryClient()
  const [selectedInstructor, setSelectedInstructor] = React.useState<string>('0')
  const [scheduleDate, setScheduleDate] = React.useState('')
  const [scheduleDuration, setScheduleDuration] = React.useState(1)
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>('0')

  const { data: formation, isLoading } = useQuery({
    queryKey: ['formation', numericId],
    queryFn: () => getFormation(numericId),
    enabled: Number.isFinite(numericId),
  })

  const { data: employees = [] } = useQuery<EmployeeRef[]>({
    queryKey: ['employees'],
    queryFn: () => listEmployees(),
  })

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['formation-participants', numericId],
    queryFn: () => getParticipants(numericId),
    enabled: Number.isFinite(numericId),
  })

  React.useEffect(() => {
    if (!formation) return
    setSelectedInstructor(String(formation.instructor?.id_emp ?? 0))
    setScheduleDate(new Date(formation.date_deb).toISOString().slice(0, 10))
    setScheduleDuration(formation.duration_days)
  }, [formation])

  const assignMut = useMutation({
    mutationFn: ({ formationId, instructorId }: { formationId: number; instructorId: number }) =>
      assignInstructor(formationId, instructorId),
    onSuccess: () => {
      toast.success('Instructor assigned')
      queryClient.invalidateQueries({ queryKey: ['formation', numericId] })
      queryClient.invalidateQueries({ queryKey: ['formations'] })
    },
    onError: () => toast.error('Failed to assign instructor'),
  })

  const scheduleMut = useMutation({
    mutationFn: ({ formationId, dateDeb, durationDays }: { formationId: number; dateDeb: string; durationDays: number }) =>
      scheduleFormation(formationId, dateDeb, durationDays),
    onSuccess: () => {
      toast.success('Schedule updated')
      queryClient.invalidateQueries({ queryKey: ['formation', numericId] })
      queryClient.invalidateQueries({ queryKey: ['formations'] })
    },
    onError: () => toast.error('Failed to update schedule'),
  })

  const addParticipantMut = useMutation({
    mutationFn: ({ formationId, empId }: { formationId: number; empId: number }) =>
      addParticipant(formationId, empId),
    onSuccess: () => {
      toast.success('Participant added')
      queryClient.invalidateQueries({ queryKey: ['formation-participants', numericId] })
      setSelectedEmployee('0')
    },
    onError: () => toast.error('Failed to add participant'),
  })

  const removeParticipantMut = useMutation({
    mutationFn: ({ formationId, empId }: { formationId: number; empId: number }) =>
      removeParticipant(formationId, empId),
    onSuccess: () => {
      toast.success('Participant removed')
      queryClient.invalidateQueries({ queryKey: ['formation-participants', numericId] })
    },
    onError: () => toast.error('Failed to remove participant'),
  })

  if (isLoading || !formation) return <div className="p-6">Loading...</div>

  const participantIds = new Set(participants.map((p) => p.id_emp))
  const eligibleEmployees = employees.filter((e) => !participantIds.has(e.id_emp))

  return (
    <div className="space-y-6 p-4 pt-0">
      {/* Formation info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-5" />
              </div>
              <div>
                <CardTitle>{formation.name}</CardTitle>
                <CardDescription>Formation details and management</CardDescription>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to={`/dashboard/formations/${formation.id_formation}/edit`}>Edit</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span>{formation.location ?? 'No location'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="size-4 shrink-0 text-muted-foreground" />
            {formation.instructor?.name
              ? <Badge>{formation.instructor.name}</Badge>
              : <Badge variant="outline">Unassigned</Badge>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <span>{new Date(formation.date_deb).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <span>{formation.duration_days} day{formation.duration_days !== 1 ? 's' : ''}</span>
          </div>
          {formation.description && (
            <p className="text-sm text-muted-foreground sm:col-span-2">{formation.description}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Instructor assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Instructor assignment</CardTitle>
            <CardDescription>Assign or change the instructor for this formation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
              <SelectTrigger>
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Select instructor</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id_emp} value={String(employee.id_emp)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                const instructorId = Number(selectedInstructor)
                if (!instructorId) {
                  toast.error('Please select an instructor')
                  return
                }
                assignMut.mutate({ formationId: formation.id_formation, instructorId })
              }}
              disabled={assignMut.isPending}
            >
              {assignMut.isPending ? 'Assigning...' : 'Assign instructor'}
            </Button>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduling</CardTitle>
            <CardDescription>Update start date and duration for this formation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start date</label>
                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Duration (days)</label>
                <Input
                  type="number"
                  min={1}
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(Number(e.target.value || 1))}
                />
              </div>
            </div>
            <Button
              onClick={() => {
                if (!scheduleDate) {
                  toast.error('Start date is required')
                  return
                }
                scheduleMut.mutate({
                  formationId: formation.id_formation,
                  dateDeb: scheduleDate,
                  durationDays: scheduleDuration,
                })
              }}
              disabled={scheduleMut.isPending}
            >
              {scheduleMut.isPending ? 'Saving...' : 'Update schedule'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                Participants
                <Badge variant="secondary">{participants.length}</Badge>
              </CardTitle>
              <CardDescription>Manage employees enrolled in this formation.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add an employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Select employee</SelectItem>
                {eligibleEmployees.map((e) => (
                  <SelectItem key={e.id_emp} value={String(e.id_emp)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                const empId = Number(selectedEmployee)
                if (!empId) {
                  toast.error('Please select an employee')
                  return
                }
                addParticipantMut.mutate({ formationId: formation.id_formation, empId })
              }}
              disabled={addParticipantMut.isPending}
            >
              {addParticipantMut.isPending ? 'Adding...' : 'Add'}
            </Button>
          </div>

          {participants.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No participants enrolled yet.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {participants.map((p) => (
                <div key={p.id_emp} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{p.role}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        removeParticipantMut.mutate({ formationId: formation.id_formation, empId: p.id_emp })
                      }
                      disabled={removeParticipantMut.isPending}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
