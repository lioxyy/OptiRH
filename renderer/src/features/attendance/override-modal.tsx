import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'
import { Checkbox } from '../../components/ui/checkbox'
import { CalendarRange, Clock } from 'lucide-react'

interface OverrideModalProps {
  employeeId: number
  employeeName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function OverrideModal({
  employeeId,
  employeeName,
  open,
  onOpenChange,
  onSuccess,
}: OverrideModalProps) {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD
  const [status, setStatus] = useState<'Present' | 'Late' | 'Absent' | 'Half-Day'>('Present')
  const [hasClockIn, setHasClockIn] = useState(true)
  const [clockInTime, setClockInTime] = useState('09:00')
  const [hasClockOut, setHasClockOut] = useState(false)
  const [clockOutTime, setClockOutTime] = useState('17:00')
  const [notes, setNotes] = useState('')

  // Reset values when employee changes or modal opens
  useEffect(() => {
    if (open) {
      setDate(new Date().toLocaleDateString('en-CA'))
      setStatus('Present')
      setHasClockIn(true)
      setClockInTime('09:00')
      setHasClockOut(false)
      setClockOutTime('17:00')
      setNotes('')
    }
  }, [open, employeeId])

  const overrideMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/api/attendance/override', payload)
      return res.data.data
    },
    onSuccess: () => {
      toast.success(`Attendance logs for ${employeeName} updated successfully!`)
      onSuccess()
      onOpenChange(false)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Manual override failed'
      toast.error(msg)
    },
  })

  const handleSave = () => {
    // Construct ISO Date strings
    let clock_in_iso: string | null = null
    let clock_out_iso: string | null = null

    if (hasClockIn && clockInTime) {
      clock_in_iso = new Date(`${date}T${clockInTime}:00`).toISOString()
    }
    if (hasClockOut && clockOutTime) {
      clock_out_iso = new Date(`${date}T${clockOutTime}:00`).toISOString()
    }

    overrideMutation.mutate({
      id_emp: employeeId,
      date,
      status,
      clock_in: clock_in_iso,
      clock_out: clock_out_iso,
      notes: notes || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/40 bg-card/90 backdrop-blur-xl shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            Attendance Correction
          </DialogTitle>
          <DialogDescription className="text-xs">
            Manually edit or create today's or historical attendance points for{' '}
            <strong className="text-foreground">{employeeName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4 text-sm">
          {/* Target Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3 rounded-lg h-10 text-xs bg-muted/10 border-border/20"
            />
          </div>

          {/* Status Override */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="col-span-3 h-10 text-xs rounded-lg bg-muted/10 border-border/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-md border-border/40">
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Half-Day">Half-Day</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clock In Punch */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-2">Clock In</label>
            <div className="col-span-3 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasClockIn"
                  checked={hasClockIn}
                  onCheckedChange={(checked) => setHasClockIn(!!checked)}
                  className="rounded border-border/40"
                />
                <label htmlFor="hasClockIn" className="text-[11px] font-medium text-muted-foreground cursor-pointer">
                  Has Clock In recorded
                </label>
              </div>

              {hasClockIn && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/10 bg-muted/5 animate-in slide-in-from-top-1 duration-150">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    type="time"
                    value={clockInTime}
                    onChange={(e) => setClockInTime(e.target.value)}
                    className="h-8 w-32 text-xs font-mono bg-background"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Clock Out Punch */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-2">Clock Out</label>
            <div className="col-span-3 space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasClockOut"
                  checked={hasClockOut}
                  onCheckedChange={(checked) => setHasClockOut(!!checked)}
                  className="rounded border-border/40"
                />
                <label htmlFor="hasClockOut" className="text-[11px] font-medium text-muted-foreground cursor-pointer">
                  Has Clock Out recorded
                </label>
              </div>

              {hasClockOut && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/10 bg-muted/5 animate-in slide-in-from-top-1 duration-150">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input
                    type="time"
                    value={clockOutTime}
                    onChange={(e) => setClockOutTime(e.target.value)}
                    className="h-8 w-32 text-xs font-mono bg-background"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes / Reason */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-2">Reason</label>
            <Input
              placeholder="e.g. Manual correction by HR..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3 rounded-lg h-10 text-xs bg-muted/10 border-border/20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/5 pt-6">
          <Button
            variant="ghost"
            className="rounded-xl h-10 text-xs font-bold uppercase text-muted-foreground"
            onClick={() => onOpenChange(false)}
            disabled={overrideMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-10 text-xs font-bold px-6 shadow-sm transition-all duration-200"
            onClick={handleSave}
            disabled={overrideMutation.isPending}
          >
            {overrideMutation.isPending ? 'Saving...' : 'Save Correction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
