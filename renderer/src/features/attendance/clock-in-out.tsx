import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { toast } from 'sonner'
import { Clock, CheckCircle2, Sun, Play, Square, Coffee } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'
import { Badge } from '../../components/ui/badge'

interface AttendanceRecord {
  id_attendance: number
  date: string
  clock_in: string | null
  clock_out: string | null
  status: 'Present' | 'Late' | 'Absent' | 'Half-Day'
  work_hours: number | null
  notes: string | null
}

export function ClockInOut() {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())

  // Keep digital clock updated in real-time
  useState(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  })

  // Fetch points history to determine today's punch state
  const { data: history = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'history'],
    queryFn: async () => {
      const res = await api.get('/api/attendance/my-history')
      return res.data.data
    },
  })

  // Find if there is a record for today
  const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
  const todayRecord = history.find((record) => {
    const recordDateStr = new Date(record.date).toLocaleDateString('en-CA')
    return recordDateStr === todayStr
  })

  // Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await api.post('/api/attendance/clock-in', { notes })
      return res.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      setNotes('')
      toast.success(
        data.status === 'Late'
          ? `Clocked-in successfully! (Status: Late ⏰)`
          : `Clocked-in successfully! Have a great day!`
      )
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Clock-in failed'
      toast.error(msg)
    },
  })

  // Clock Out Mutation
  const clockOutMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await api.post('/api/attendance/clock-out', { notes })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      setNotes('')
      toast.success('Clocked-out successfully! See you tomorrow!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Clock-out failed'
      toast.error(msg)
    },
  })

  if (isLoading) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  const isClockedIn = !!todayRecord?.clock_in
  const isClockedOut = !!todayRecord?.clock_out

  // Formatted punch times
  const punchInTime = todayRecord?.clock_in
    ? new Date(todayRecord.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : ''
  const punchOutTime = todayRecord?.clock_out
    ? new Date(todayRecord.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-300 hover:border-primary/20">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-muted/50 rounded-xl flex items-center justify-center border border-border/10">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Punch Clock</CardTitle>
              <CardDescription className="text-xs">Record your daily office timestamps.</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] bg-muted/20 border-border/10 rounded-full px-3 py-1 font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Real-time digital clock */}
        <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-2xl border border-border/5">
          <span className="text-4xl font-mono font-bold tracking-tight text-foreground">
            {currentTime}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2 opacity-70">
            Workstation Local Time
          </span>
        </div>

        {/* State 1: Ready to Clock In */}
        {!isClockedIn && (
          <div className="space-y-4">
            <div className="text-center p-5 rounded-xl border border-dashed border-border/20 bg-muted/5 space-y-1">
              <Sun className="h-5 w-5 text-muted-foreground/60 mx-auto" />
              <p className="text-xs font-semibold mt-3">Ready to Clock In</p>
              <p className="text-[10px] text-muted-foreground">Your attendance hasn't been recorded yet.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Optional Notes</label>
              <Input
                placeholder="Work location or status..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs rounded-lg border-border/20 bg-muted/10"
              />
            </div>

            <Button
              className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-xl shadow-sm transition-all duration-200 gap-2"
              onClick={() => clockInMutation.mutate(notes)}
              disabled={clockInMutation.isPending}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {clockInMutation.isPending ? 'Processing...' : 'Clock In Now'}
            </Button>
          </div>
        )}

        {/* State 2: Clocked In (Active Shift) */}
        {isClockedIn && !isClockedOut && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border/20 bg-muted/5 space-y-2">
              <div className="flex items-center gap-2 text-foreground text-xs font-bold">
                <Coffee className="h-4 w-4" />
                Active Shift
              </div>
              <p className="text-[11px] text-muted-foreground">
                Clocked in at <strong className="text-foreground">{punchInTime}</strong> today.
              </p>
              {todayRecord?.status === 'Late' && (
                <Badge variant="outline" className="text-[9px] text-yellow-500/80 border-yellow-500/20 bg-yellow-500/5 font-mono uppercase">
                  Lateness Logged
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Closing Notes</label>
              <Input
                placeholder="Remarks before leaving..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs rounded-lg border-border/20 bg-muted/10"
              />
            </div>

            <Button
              className="w-full h-11 bg-background border border-border/40 hover:bg-muted/10 text-foreground font-bold rounded-xl shadow-sm transition-all duration-200 gap-2"
              onClick={() => clockOutMutation.mutate(notes)}
              disabled={clockOutMutation.isPending}
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              {clockOutMutation.isPending ? 'Processing...' : 'Clock Out Now'}
            </Button>
          </div>
        )}

        {/* State 3: Completed */}
        {isClockedIn && isClockedOut && (
          <div className="p-5 rounded-xl border border-border/20 bg-muted/5 space-y-4 text-center">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Attendance Logged</p>
              <p className="text-[10px] text-muted-foreground">Shift successfully completed for today.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 text-[10px] border-t border-border/10">
              <div className="text-left">
                <span className="text-muted-foreground uppercase block mb-1">Entry time</span>
                <strong className="text-foreground text-xs">{punchInTime}</strong>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground uppercase block mb-1">Exit time</span>
                <strong className="text-foreground text-xs">{punchOutTime}</strong>
              </div>
            </div>

            {todayRecord?.work_hours && (
              <div className="pt-2">
                <Badge variant="secondary" className="text-[10px] font-mono bg-muted/30 border-border/5 px-3 py-1">
                  Duration: {todayRecord.work_hours.toFixed(2)}h
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
