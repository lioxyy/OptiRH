import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Search, UserCheck, AlertTriangle, UserX, Users2, CalendarDays, Edit3, TrendingUp } from 'lucide-react'
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
  Present: { label: 'Present', variant: 'outline' as const, className: 'text-emerald-500/80 border-emerald-500/10 bg-transparent font-medium' },
  Late: { label: 'Late', variant: 'outline' as const, className: 'text-amber-500/80 border-amber-500/10 bg-transparent font-medium' },
  'Half-Day': { label: 'Half-Day', variant: 'outline' as const, className: 'text-blue-500/80 border-blue-500/10 bg-transparent font-medium' },
  Absent: { label: 'Absent', variant: 'outline' as const, className: 'text-destructive/80 border-destructive/10 bg-transparent font-medium' },
  'On Leave': { label: 'On Leave', variant: 'outline' as const, className: 'text-indigo-500/80 border-indigo-500/10 bg-transparent font-medium' },
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
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
    <div className="space-y-8">
      {/* ── KPIs Metric Cards Grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Staff', val: isLoading ? '...' : totalStaff, trend: 'Stable', foot: 'Total workforce', icon: Users2, color: 'text-foreground' },
          { label: 'Present', val: isLoading ? '...' : presentCount, trend: '+2', foot: 'Across units', icon: UserCheck, color: 'text-emerald-500/80' },
          { label: 'Late', val: isLoading ? '...' : lateCount, trend: '-1', foot: 'Today logged', icon: AlertTriangle, color: 'text-amber-500/80' },
          { label: 'Absent', val: isLoading ? '...' : absentCount, trend: 'Unchanged', foot: 'Unjustified', icon: UserX, color: 'text-destructive/80' },
          { label: 'On Leave', val: isLoading ? '...' : onLeaveCount, trend: '+1', foot: 'Approved balances', icon: CalendarDays, color: 'text-indigo-500/80' },
        ].map((kpi, i) => (
          <Card key={i} className="border-primary/5 bg-card/40 backdrop-blur-sm shadow-sm hover:border-primary/20 transition-all group p-4">
            <div className="flex flex-col justify-between h-full space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-80">{kpi.label}</span>
                <kpi.icon className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
              </div>

              <div className="flex items-end justify-between gap-2">
                <h3 className={`text-2xl font-mono font-bold tracking-tight ${kpi.color}`}>{kpi.val}</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-500 flex items-center gap-1 border border-emerald-500/10`}>
                    <TrendingUp className="h-2.5 w-2.5" />
                    {kpi.trend}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-primary/5">
                <p className="text-[9px] text-muted-foreground font-medium opacity-60">
                  <span className="font-bold">{kpi.foot.split(' ')[0]}</span> {kpi.foot.split(' ').slice(1).join(' ')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Table Grid with search ──────────────────────────────── */}
      <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg transition-all hover:border-primary/10">
        <CardHeader className="pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-muted/50 rounded-xl flex items-center justify-center border border-border/10">
              <Users2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Roster Renseignements</CardTitle>
              <CardDescription className="text-xs">Consolidated real-time view of organizational manpower.</CardDescription>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Search employee or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-muted/10 border-border/20"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 border-t border-border/5">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="text-center py-20 bg-muted/5">
              <Users2 className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No matching records</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Adjust filters or search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-border/10 hover:bg-transparent">
                    <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Employee</TableHead>
                    <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Department</TableHead>
                    <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Status</TableHead>
                    <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Clock In</TableHead>
                    <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Clock Out</TableHead>
                    <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Total Shift</TableHead>
                    <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider text-right pr-6">Override</TableHead>
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
                      <TableRow key={item.id_emp} className="border-border/5 hover:bg-muted/5 group transition-all duration-150">
                        <TableCell className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono opacity-70">{item.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">{item.departmentName}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant={cfg.variant} className={`text-[9px] font-mono py-0 px-2 rounded-full border bg-transparent ${cfg.className}`}>
                            {cfg.label.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm font-mono font-bold text-foreground">
                          {formatTime(item.attendance?.clock_in)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm font-mono font-bold text-foreground">
                          {formatTime(item.attendance?.clock_out)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs font-mono text-muted-foreground">
                          {item.attendance?.work_hours ? `${item.attendance.work_hours.toFixed(2)}h` : '—'}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right pr-6">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-[10px] font-bold uppercase rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 border border-transparent hover:border-border/10 gap-2 px-3"
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
