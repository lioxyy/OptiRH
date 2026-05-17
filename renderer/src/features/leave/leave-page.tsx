import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table'
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

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role !== 'Employee' && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approver</TableHead>
                {(user?.role === 'Admin' || user?.role === 'Agent') && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave) => (
                <TableRow key={leave.id_conge}>
                  {user?.role !== 'Employee' && (
                    <TableCell className="font-medium">{leave.employee?.name}</TableCell>
                  )}
                  <TableCell>{leave.leave_type.name}</TableCell>
                  <TableCell>{new Date(leave.date_deb).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(leave.date_fin).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[leave.status] ?? 'outline'}>{leave.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{leave.approver?.name ?? '—'}</TableCell>
                  {(user?.role === 'Admin' || user?.role === 'Agent') && (
                    <TableCell className="text-right space-x-2">
                      {leave.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => actionMutation.mutate({ id: leave.id_conge, action: 'approve' })}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => actionMutation.mutate({ id: leave.id_conge, action: 'reject' })}>Reject</Button>
                        </>
                      )}
                      {leave.status === 'Approved' && user?.role === 'Admin' && (
                        <Button size="sm" variant="destructive" onClick={() => actionMutation.mutate({ id: leave.id_conge, action: 'cancel' })}>Cancel</Button>
                      )}
                      {user?.role === 'Admin' && (
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(leave.id_conge)}>Delete</Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {leaves.length === 0 && (
                <TableRow>
                  <TableCell colSpan={user?.role === 'Employee' ? 5 : 7} className="text-center py-6 text-muted-foreground">
                    No leave requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && <LeaveForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
