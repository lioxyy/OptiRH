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
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-indigo-400" />
            Attendance Correction
          </DialogTitle>
          <DialogDescription>
            Manually edit or create today's or historical attendance points for{' '}
            <strong className="text-foreground">{employeeName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-sm">
          {/* Target Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-xs font-semibold text-muted-foreground">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3 rounded-lg h-9 text-xs"
            />
          </div>

          {/* Status Override */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-xs font-semibold text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="col-span-3 h-9 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Late">Late ⏰</SelectItem>
                <SelectItem value="Half-Day">Half-Day</SelectItem>
                <SelectItem value="Absent">Absent ❌</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clock In Punch */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-right text-xs font-semibold text-muted-foreground pt-2">Clock In</label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasClockIn"
                  checked={hasClockIn}
                  onCheckedChange={(checked) => setHasClockIn(!!checked)}
                  className="rounded"
                />
                <label htmlFor="hasClockIn" className="text-xs font-medium cursor-pointer">
                  Has Clock In recorded
                </label>
              </div>

              {hasClockIn && (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={clockInTime}
                    onChange={(e) => setClockInTime(e.target.value)}
                    className="h-8 w-28 text-xs rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Clock Out Punch */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-right text-xs font-semibold text-muted-foreground pt-2">Clock Out</label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasClockOut"
                  checked={hasClockOut}
                  onCheckedChange={(checked) => setHasClockOut(!!checked)}
                  className="rounded"
                />
                <label htmlFor="hasClockOut" className="text-xs font-medium cursor-pointer">
                  Has Clock Out recorded
                </label>
              </div>

              {hasClockOut && (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={clockOutTime}
                    onChange={(e) => setClockOutTime(e.target.value)}
                    className="h-8 w-28 text-xs rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes / Reason */}
          <div className="grid grid-cols-4 items-start gap-4">
            <label className="text-right text-xs font-semibold text-muted-foreground pt-2">Reason</label>
            <Input
              placeholder="e.g. Employee forgot card, manual correction by HR..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3 rounded-lg h-9 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            className="rounded-lg h-9 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={overrideMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-xs px-4 gap-1 shadow-md hover:shadow-lg transition-all duration-200"
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
