import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Search, UserCheck, AlertTriangle, UserX, Users2, CalendarDays, Edit3 } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'
import { OverrideModal } from './override-modal'

interface RosterItem {
  id_emp: number
  name: string
  email: string
  role: string
  departmentName: string
  status: 'Present' | 'Late' | 'Absent' | 'Half-Day' | 'On Leave'
  onLeave: boolean
  attendance: {
    id_attendance: number
    clock_in: string | null
    clock_out: string | null
    notes: string | null
    work_hours: number | null
  } | null
}

const STATUS_CONFIG = {
  Present: { label: 'Present', variant: 'default' as const, className: 'bg-emerald-500 hover:bg-emerald-600 text-white font-semibold' },
  Late: { label: 'Late', variant: 'outline' as const, className: 'text-amber-500 border-amber-500/30 bg-amber-500/5 font-semibold animate-pulse' },
  'Half-Day': { label: 'Half-Day', variant: 'outline' as const, className: 'text-blue-500 border-blue-500/30 bg-blue-500/5 font-semibold' },
  Absent: { label: 'Absent', variant: 'destructive' as const, className: 'font-semibold' },
  'On Leave': { label: 'On Leave', variant: 'outline' as const, className: 'text-indigo-500 border-indigo-500/30 bg-indigo-500/5 font-semibold' },
}

export function DailyRoster() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<{ id_emp: number; name: string } | null>(null)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)

  // Query live daily attendance roster from backend
  const { data: roster = [], isLoading } = useQuery<RosterItem[]>({
    queryKey: ['attendance', 'roster'],
    queryFn: async () => {
      const res = await api.get('/api/attendance/roster')
      return res.data.data
    },
  })

  // Search filter
  const filteredRoster = roster.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // KPI Calculations
  const totalStaff = roster.length
  const presentCount = roster.filter((r) => r.status === 'Present' || r.status === 'Late' || r.status === 'Half-Day').length
  const lateCount = roster.filter((r) => r.status === 'Late').length
  const absentCount = roster.filter((r) => r.status === 'Absent').length
  const onLeaveCount = roster.filter((r) => r.status === 'On Leave').length

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return '—'
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleOpenOverride = (employee: { id_emp: number; name: string }) => {
    setSelectedEmployee(employee)
    setIsOverrideOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* ── KPIs Metric Cards Grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Active */}
        <Card className="border-border/40 bg-card/30 backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Users2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Total Staff</span>
              <span className="text-xl font-bold font-mono">{isLoading ? '...' : totalStaff}</span>
            </div>
          </CardContent>
        </Card>

        {/* Present */}
        <Card className="border-border/40 bg-card/30 backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Present</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{isLoading ? '...' : presentCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Late */}
        <Card className="border-border/40 bg-card/30 backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Late</span>
              <span className="text-xl font-bold font-mono text-amber-400">{isLoading ? '...' : lateCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card className="border-border/40 bg-card/30 backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <UserX className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Absent</span>
              <span className="text-xl font-bold font-mono text-destructive">{isLoading ? '...' : absentCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* On Leave */}
        <Card className="border-border/40 bg-card/30 backdrop-blur-md md:col-span-1 col-span-2">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block font-semibold">On Leave</span>
              <span className="text-xl font-bold font-mono text-indigo-400">{isLoading ? '...' : onLeaveCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Table Grid with search ──────────────────────────────── */}
      <Card className="border-border/40 bg-card/30 backdrop-blur-xl">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Roster Renseignements</CardTitle>
            <CardDescription>Live daily pointages overview with filters.</CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 border-t border-border/10">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="text-center py-16">
              <Users2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No employees found today.</p>
              <p className="text-xs text-muted-foreground/60">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/15">
                  <TableRow className="border-border/10">
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Employee</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Department</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Clock In</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Clock Out</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Total Shift</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground text-right">Override</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoster.map((item) => {
                    const cfg = STATUS_CONFIG[item.status] || {
                      label: item.status,
                      variant: 'outline' as const,
                      className: '',
                    }
                    return (
                      <TableRow key={item.id_emp} className="border-border/10 hover:bg-muted/5 transition-all duration-150">
                        <TableCell className="py-3 px-4 font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{item.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs font-semibold text-muted-foreground">{item.departmentName}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant={cfg.variant} className={`text-[10px] py-0.5 px-2 rounded-full border ${cfg.className}`}>
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm font-semibold text-foreground">
                          {formatTime(item.attendance?.clock_in)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm font-semibold text-foreground">
                          {formatTime(item.attendance?.clock_out)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm font-mono text-muted-foreground">
                          {item.attendance?.work_hours ? `${item.attendance.work_hours.toFixed(2)}h` : '—'}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs rounded-lg text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 gap-1"
                            onClick={() => handleOpenOverride({ id_emp: item.id_emp, name: item.name })}
                          >
                            <Edit3 className="h-3 w-3" />
                            Correct
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Manual Override Modal ──────────────────────────────── */}
      {selectedEmployee && (
        <OverrideModal
          employeeId={selectedEmployee.id_emp}
          employeeName={selectedEmployee.name}
          open={isOverrideOpen}
          onOpenChange={setIsOverrideOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] })
          }}
        />
      )}
    </div>
  )
}
