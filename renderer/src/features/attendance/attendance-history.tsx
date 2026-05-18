import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { History as HistoryIcon, Calendar } from 'lucide-react'
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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg transition-all hover:border-primary/10">
      <CardHeader className="pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-muted/50 rounded-xl flex items-center justify-center border border-border/10">
              <HistoryIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Pointage Records</CardTitle>
              <CardDescription className="text-xs">Historical audit of your individual attendance logs.</CardDescription>
            </div>
          </div>

          {/* Quick Date Range Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-muted/20 border border-border/10 rounded-xl p-1.5 px-3">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-7 w-28 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[10px] uppercase font-bold p-0"
              />
              <span className="text-[10px] text-muted-foreground font-bold px-1">/</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-7 w-28 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[10px] uppercase font-bold p-0"
              />
            </div>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-[10px] uppercase font-bold text-muted-foreground hover:bg-muted/10 transition-all duration-200"
                onClick={clearFilters}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 border-t border-border/5">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-muted/5">
            <Calendar className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No logs available</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Adjust filters or record your first punch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/10 hover:bg-transparent">
                  <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Date</TableHead>
                  <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Status</TableHead>
                  <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Clock In</TableHead>
                  <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Clock Out</TableHead>
                  <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Work Hours</TableHead>
                  <TableHead className="h-10 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Notes</TableHead>
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
                    <TableRow key={record.id_attendance} className="border-border/5 hover:bg-muted/5 group transition-all duration-150">
                      <TableCell className="py-3 px-4 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{formatDay(record.date)}</TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant={cfg.variant} className={`text-[9px] font-mono py-0 px-2 rounded-full border bg-transparent ${cfg.className}`}>
                          {cfg.label.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm font-mono font-bold text-foreground">{formatTime(record.clock_in)}</TableCell>
                      <TableCell className="py-3 px-4 text-sm font-mono font-bold text-foreground">{formatTime(record.clock_out)}</TableCell>
                      <TableCell className="py-3 px-4 text-xs font-mono text-muted-foreground">
                        {record.work_hours ? `${record.work_hours.toFixed(2)}h` : '—'}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-[11px] text-muted-foreground max-w-[200px] truncate" title={record.notes || ''}>
                        {record.notes || <span className="opacity-20">—</span>}
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
