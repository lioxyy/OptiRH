import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { format } from 'date-fns'
import { History as HistoryIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { cn } from '@/lib/utils'
import { DatePickerWithRange } from '../../components/ui/date-range-picker'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { ColumnDef } from '@tanstack/react-table'

interface AttendanceRecord {
  id_attendance: number
  date: string
  clock_in: string | null
  clock_out: string | null
  status: 'Present' | 'Late' | 'Absent' | 'Half-Day'
  work_hours: number | null
  notes: string | null
}

export function AttendanceHistory() {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  const { data: history = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'history', startDate, endDate],
    queryFn: async () => {
      const params: any = {}
      if (startDate) params.startDate = startDate.toISOString()
      if (endDate) params.endDate = endDate.toISOString()

      const res = await api.get('/api/attendance/my-history', { params })
      return res.data.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Date formatting helper
  const formatDateStr = (date: string) => format(new Date(date), 'PP')
  const formatTimeStr = (time: string | null) => time ? format(new Date(time), 'HH:mm') : '--:--'

  // Columns definition for GenericDataTable
  const columns: ColumnDef<AttendanceRecord>[] = [
    {
      accessorKey: 'date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => <span className="font-medium">{formatDateStr(row.getValue('date'))}</span>
    },
    {
      accessorKey: 'clock_in',
      header: "Clock In",
      cell: ({ row }) => <span className="font-mono text-xs">{formatTimeStr(row.getValue('clock_in'))}</span>
    },
    {
      accessorKey: 'clock_out',
      header: "Clock Out",
      cell: ({ row }) => <span className="font-mono text-xs">{formatTimeStr(row.getValue('clock_out'))}</span>
    },
    {
      accessorKey: 'work_hours',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Hours" />,
      cell: ({ row }) => {
        const hours = row.getValue('work_hours') as number | null
        return hours ? <span className="font-mono text-xs font-bold text-foreground">{hours.toFixed(2)}h</span> : '--'
      }
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const colors: Record<string, string> = {
          'Present': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          'Late': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          'Absent': 'bg-destructive/10 text-destructive border-destructive/20',
          'Half-Day': 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        }
        return (
          <Badge variant="outline" className={cn("font-medium text-[10px] uppercase", colors[status] || "bg-muted text-muted-foreground")}>
            {status}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'notes',
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground max-w-[200px] truncate block" title={row.getValue('notes') || ''}>
          {row.getValue('notes') || <span className="opacity-20">—</span>}
        </span>
      )
    }
  ]

  return (
    <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden">
      <CardHeader className="border-b border-primary/5 bg-muted/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HistoryIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Attendance History</CardTitle>
              <CardDescription className="text-xs">Review your historical clock-in/out records and productivity patterns</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DatePickerWithRange
              onChange={(range) => {
                setStartDate(range?.from)
                setEndDate(range?.to)
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <GenericDataTable
          columns={columns}
          data={history}
          searchKey="status"
          searchPlaceholder="Filter by status..."
        />
      </CardContent>
    </Card>
  )
}
