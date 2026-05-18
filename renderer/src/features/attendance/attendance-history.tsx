import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { CalendarRange, Calendar } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

interface AttendanceRecord {
  id_attendance: number
  date: string
  clock_in: string | null
  clock_out: string | null
  status: 'Present' | 'Late' | 'Absent' | 'Half-Day'
  work_hours: number | null
  notes: string | null
}

const STATUS_CONFIG = {
  Present: { label: 'Present', variant: 'outline' as const, className: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5 font-semibold' },
  Late: { label: 'Late', variant: 'outline' as const, className: 'text-amber-500 border-amber-500/30 bg-amber-500/5 font-semibold' },
  'Half-Day': { label: 'Half-Day', variant: 'outline' as const, className: 'text-blue-500 border-blue-500/30 bg-blue-500/5 font-semibold' },
  Absent: { label: 'Absent', variant: 'outline' as const, className: 'text-destructive border-destructive/30 bg-destructive/5 font-semibold' },
}

export function AttendanceHistory() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Query points history with active date filters
  const { data: history = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'history', startDate, endDate],
    queryFn: async () => {
      const params: any = {}
      if (startDate) params.startDate = new Date(startDate).toISOString()
      if (endDate) params.endDate = new Date(endDate).toISOString()

      const res = await api.get('/api/attendance/my-history', { params })
      return res.data.data
    },
  })

  // Date formatting helpers
  const formatDay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '—'
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-indigo-400" />
              Attendance History
            </CardTitle>
            <CardDescription>Track your past clock-ins, lateness, and total hours.</CardDescription>
          </div>

          {/* Quick Date Range Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-muted/20 border border-border/10 rounded-xl p-1">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-32 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs px-2"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-32 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs px-2"
              />
            </div>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all duration-200"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 border-t border-border/10">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 space-y-2 border-b border-border/10">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No logs matching filter criteria.</p>
            <p className="text-xs text-muted-foreground/60">Your punch history will appear here once recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/10">
                  <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Date</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Clock In</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Clock Out</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Work Hours</TableHead>
                  <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground max-w-xs truncate">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => {
                  const cfg = STATUS_CONFIG[record.status] || {
                    label: record.status,
                    variant: 'outline' as const,
                    className: '',
                  }
                  return (
                    <TableRow key={record.id_attendance} className="border-border/10 hover:bg-muted/5 transition-all duration-150">
                      <TableCell className="py-3 px-4 text-sm font-medium">{formatDay(record.date)}</TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant={cfg.variant} className={`text-[10px] py-0.5 px-2 rounded-full border ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm font-semibold text-foreground">{formatTime(record.clock_in)}</TableCell>
                      <TableCell className="py-3 px-4 text-sm font-semibold text-foreground">{formatTime(record.clock_out)}</TableCell>
                      <TableCell className="py-3 px-4 text-sm font-mono text-muted-foreground">
                        {record.work_hours ? `${record.work_hours.toFixed(2)}h` : '—'}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate" title={record.notes || ''}>
                        {record.notes || <span className="text-muted-foreground/30">—</span>}
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
  )
}
