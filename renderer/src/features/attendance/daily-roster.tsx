import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Users, Clock, Calendar, TrendingUp, Edit3 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
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

export function DailyRoster() {
  const queryClient = useQueryClient()
  const [selectedEmployee, setSelectedEmployee] = useState<{ id_emp: number; name: string } | null>(null)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)

  const { data: roster = [] } = useQuery<RosterItem[]>({
    queryKey: ['attendance', 'roster'],
    queryFn: async () => {
      const res = await api.get('/api/attendance/roster')
      return res.data.data
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

  // Columns definition for GenericDataTable
  const columns: ColumnDef<RosterItem>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.getValue('name')}</span>
          <span className="text-[10px] text-muted-foreground">{row.original.role}</span>
        </div>
      )
    },
    {
      accessorKey: 'departmentName',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
      cell: ({ row }) => <span className="text-muted-foreground text-xs uppercase tracking-tight font-medium">{row.getValue('departmentName') || 'N/A'}</span>
    },
    {
      id: 'clock_in',
      header: "Clock In",
      cell: ({ row }) => {
        const time = row.original.attendance?.clock_in
        return time ? <span className="font-mono text-xs">{format(new Date(time), 'HH:mm')}</span> : '--:--'
      }
    },
    {
      id: 'clock_out',
      header: "Clock Out",
      cell: ({ row }) => {
        const time = row.original.attendance?.clock_out
        return time ? <span className="font-mono text-xs">{format(new Date(time), 'HH:mm')}</span> : '--:--'
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
          'On Leave': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
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
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-[10px] font-bold uppercase rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all gap-2"
            onClick={() => {
              setSelectedEmployee({ id_emp: row.original.id_emp, name: row.original.name })
              setIsOverrideOpen(true)
            }}
          >
            <Edit3 className="h-3 w-3" />
            Correct
          </Button>
        </div>
      )
    }
  ]

  // KPI Calculations
  const total = roster.length
  const present = roster.filter(e => e.status === 'Present' || e.status === 'Late').length
  const late = roster.filter(e => e.status === 'Late').length
  const onLeave = roster.filter(e => e.status === 'On Leave').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workforce</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{total}</div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-[10px] py-0 border-0">
                <TrendingUp className="h-3 w-3 mr-1" /> ACTIVE
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">Total Employees</p>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-emerald-500">{present}</div>
              <div className="text-[10px] font-semibold text-emerald-500/70">
                {total > 0 ? ((present / total) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="w-full bg-emerald-500/10 h-1 rounded-full mt-2">
              <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${total > 0 ? (present / total) * 100 : 0}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tardiness</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-amber-500">{late}</div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">Late arrivals</p>
          </CardContent>
        </Card>

        <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Leave</CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Calendar className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-indigo-500">{onLeave}</div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">Approved requests</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden">
        <CardHeader className="border-b border-primary/5 bg-muted/20 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Daily Roster</CardTitle>
              <CardDescription className="text-xs">Real-time attendance and leave status for all personnel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <GenericDataTable
            columns={columns}
            data={roster}
            searchKey="name"
            searchPlaceholder="Search employees..."
            searchOptions={[
              { id: 'name', label: 'Employee Name' },
              { id: 'departmentName', label: 'Department' }
            ]}
          />
        </CardContent>
      </Card>

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
