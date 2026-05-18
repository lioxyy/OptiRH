import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { Check, X } from 'lucide-react'

interface LeaveRequest {
  id_conge: number
  status: 'Pending' | 'Approved' | 'Rejected'
  date_deb: string
  date_fin: string
  id_type: number
  id_emp: number
  employee: { name: string }
  leave_type: { name: string }
}

const STATUS_CONFIG = {
  Pending:  { label: 'Pending', variant: 'outline' as const, className: 'text-yellow-600 border-yellow-400' },
  Approved: { label: 'Approved', variant: 'default' as const, className: '' },
  Rejected: { label: 'Rejected', variant: 'secondary' as const, className: 'text-destructive' },
}

function calcDays(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function LeaveRequestsTable() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isManager = user?.role === 'Admin' || user?.role === 'Agent'

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leaves', 'requests'],
    queryFn: async () => {
      const res = await api.get('/api/leaves')
      return res.data.data
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'Approved' | 'Rejected' }) =>
      api.patch(`/api/leaves/${id}/action`, { action: status.toLowerCase() }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      toast.success(vars.status === 'Approved' ? 'Request approved' : 'Request rejected')
    },
    onError: () => toast.error('Failed to update leave status'),
  })

  if (isLoading) return <div className="py-6 text-sm text-muted-foreground">Loading leaves history...</div>

  const columns: ColumnDef<LeaveRequest>[] = [
    ...(isManager ? [
      {
        id: "employee",
        accessorFn: (row) => row.employee?.name ?? '—',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
        cell: ({ row }) => <span className="font-medium">{row.original.employee?.name ?? '—'}</span>
      }
    ] : []),
    {
      id: "leave_type",
      accessorFn: (row) => row.leave_type?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Leave Type" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.leave_type?.name}</span>
    },
    {
      id: "date_deb",
      accessorKey: "date_deb",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
      cell: ({ row }) => <span>{formatDate(row.original.date_deb)}</span>
    },
    {
      id: "date_fin",
      accessorKey: "date_fin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
      cell: ({ row }) => <span>{formatDate(row.original.date_fin)}</span>
    },
    {
      id: "days",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
      cell: ({ row }) => <span>{calcDays(row.original.date_deb, row.original.date_fin)} days</span>
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const cfg = STATUS_CONFIG[row.original.status]
        return (
          <Badge variant={cfg.variant} className={cfg.className}>
            {cfg.label}
          </Badge>
        )
      }
    },
    ...(isManager ? [
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: LeaveRequest } }) => {
          const req = row.original
          if (req.status !== 'Pending') return <span className="text-xs text-muted-foreground">—</span>
          return (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="default"
                className="h-7 px-2"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: req.id_conge, status: 'Approved' })}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: req.id_conge, status: 'Rejected' })}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )
        }
      }
    ] : [])
  ]

  return (
    <GenericDataTable
      columns={columns}
      data={requests}
      searchOptions={[
        ...(isManager ? [{ id: "employee", label: "Employee" }] : []),
        { id: "leave_type", label: "Leave Type" },
        { id: "status", label: "Status" }
      ]}
    />
  )
}
