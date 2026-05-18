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
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-border/80">
      {/* Glow background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-400" />
            Punch Clock
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-muted/30">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
        <CardDescription>Record your daily office timestamps.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Real-time digital clock */}
        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-2xl border border-border/10">
          <span className="text-3xl font-mono font-extrabold tracking-widest text-foreground">
            {currentTime}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            Local workstation time
          </span>
        </div>

        {/* State 1: Ready to Clock In */}
        {!isClockedIn && (
          <div className="space-y-4">
            <div className="text-center p-4 rounded-xl border border-dashed border-border/30 bg-muted/10 space-y-1">
              <Sun className="h-6 w-6 text-yellow-400 mx-auto animate-pulse" />
              <p className="text-sm font-semibold mt-2">Ready to Clock In</p>
              <p className="text-xs text-muted-foreground">You haven't recorded your attendance today.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Add Optional Notes</label>
              <Input
                placeholder="e.g. Working from annex building..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <Button
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 gap-2"
              onClick={() => clockInMutation.mutate(notes)}
              disabled={clockInMutation.isPending}
            >
              <Play className="h-4 w-4 fill-current" />
              {clockInMutation.isPending ? 'Clocking In...' : 'Clock In Now'}
            </Button>
          </div>
        )}

        {/* State 2: Clocked In (Waiting for Clock Out) */}
        {isClockedIn && !isClockedOut && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <Coffee className="h-4 w-4 animate-bounce" />
                Active Shift
              </div>
              <p className="text-xs text-muted-foreground">
                Clocked in at <strong className="text-foreground">{punchInTime}</strong> today.
              </p>
              {todayRecord?.status === 'Late' && (
                <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-500/30 bg-yellow-500/5">
                  Lateness Recorded ⏰
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Add Closing Notes</label>
              <Input
                placeholder="e.g. Successfully finished daily tasks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <Button
              className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 gap-2"
              onClick={() => clockOutMutation.mutate(notes)}
              disabled={clockOutMutation.isPending}
            >
              <Square className="h-4 w-4 fill-current" />
              {clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out Now'}
            </Button>
          </div>
        )}

        {/* State 3: Clocked Out Completed */}
        {isClockedIn && isClockedOut && (
          <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-3 text-center">
            <CheckCircle2 className="h-8 w-8 text-teal-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Attendance Logged</p>
              <p className="text-xs text-muted-foreground">Great job! Your shift is successfully completed.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-border/10">
              <div className="text-left">
                <span className="text-muted-foreground block">Clock In</span>
                <strong className="text-foreground">{punchInTime}</strong>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block">Clock Out</span>
                <strong className="text-foreground">{punchOutTime}</strong>
              </div>
            </div>

            {todayRecord?.work_hours && (
              <Badge variant="secondary" className="mt-2 text-xs font-mono">
                Total Shift Time: {todayRecord.work_hours.toFixed(2)}h
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
