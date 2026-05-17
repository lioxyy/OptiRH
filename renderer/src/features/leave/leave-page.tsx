import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { LeaveForm } from './leave-form'

interface LeaveBalance {
  id_balance: number
  id_type: number
  year: number
  allocated: number
  consumed: number
  carried_over: number
  remaining: number
  leave_type: { name: string, default_days: number }
}

interface LeaveRequest {
  id_conge: number
  date_deb: string
  date_fin: string
  status: string
  leave_type: { name: string }
  employee: { name: string }
  approver?: { name: string } | null
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Approved: 'default',
  Pending: 'secondary',
  Rejected: 'destructive',
}

export function LeavePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: balances = [], isLoading: balancesLoading } = useQuery<LeaveBalance[]>({
    queryKey: ['leave-balances', new Date().getFullYear()],
    queryFn: async () => {
      const res = await api.get(`/api/leave/balance?year=${new Date().getFullYear()}`)
      return res.data.data
    },
    enabled: user?.role === 'Employee',
  })

  const { data: leaves = [], isLoading: leavesLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leaves'],
    queryFn: async () => {
      const res = await api.get('/api/leave')
      return res.data.data
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number, action: 'approve' | 'reject' | 'cancel' }) => {
      await api.patch(`/api/leave/${id}/action`, { action })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      if (user?.role === 'Employee') {
        queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/leave/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] })
    }
  })

  if (leavesLoading || (user?.role === 'Employee' && balancesLoading)) {
    return <div className="p-6">Loading...</div>
  }

  const columns = React.useMemo<ColumnDef<LeaveRequest>[]>(() => {
    const baseCols: ColumnDef<LeaveRequest>[] = [
      ...((user?.role !== 'Employee' ? [{
        id: "employee",
        accessorFn: (row: LeaveRequest) => row.employee?.name ?? '—',
        header: ({ column }: any) => <DataTableColumnHeader column={column} title="Employee" />,
      }] : []) as ColumnDef<LeaveRequest>[]),
      {
        id: "type",
        accessorFn: (row) => row.leave_type?.name ?? '—',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      },
      {
        id: "start_date",
        accessorKey: "date_deb",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
        cell: ({ row }) => new Date(row.original.date_deb).toLocaleDateString(),
      },
      {
        id: "end_date",
        accessorKey: "date_fin",
        header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
        cell: ({ row }) => new Date(row.original.date_fin).toLocaleDateString(),
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status] ?? 'outline'}>{row.original.status}</Badge>,
      },
      {
        id: "approver",
        accessorFn: (row) => row.approver?.name ?? '—',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Approver" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.approver?.name ?? '—'}</span>,
      }
    ]

    if (user?.role === 'Admin' || user?.role === 'Agent') {
      baseCols.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {row.original.status === 'Pending' && (
              <>
                <Button size="sm" variant="outline" onClick={() => actionMutation.mutate({ id: row.original.id_conge, action: 'approve' })}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => actionMutation.mutate({ id: row.original.id_conge, action: 'reject' })}>Reject</Button>
              </>
            )}
            {row.original.status === 'Approved' && user?.role === 'Admin' && (
              <Button size="sm" variant="destructive" onClick={() => actionMutation.mutate({ id: row.original.id_conge, action: 'cancel' })}>Cancel</Button>
            )}
            {user?.role === 'Admin' && (
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(row.original.id_conge)}>Delete</Button>
            )}
          </div>
        )
      })
    }
    return baseCols
  }, [user, actionMutation, deleteMutation])

  if (leavesLoading || (user?.role === 'Employee' && balancesLoading)) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leave Management</h1>
        {user?.role === 'Employee' && (
          <Button onClick={() => setShowForm(true)}>New Request</Button>
        )}
      </div>

      {user?.role === 'Employee' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {balances.map((balance) => (
            <Card key={balance.id_balance}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{balance.leave_type.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{balance.remaining} days</div>
                <div className="text-sm text-muted-foreground">
                  {balance.consumed} consumed / {balance.allocated + balance.carried_over} total
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GenericDataTable
        columns={columns}
        data={leaves}
        searchKey="type"
        searchPlaceholder="Filter leaves by type..."
      />

      {showForm && <LeaveForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
