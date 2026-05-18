import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
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
  Pending:  { label: 'Pending', variant: 'outline'    as const, className: 'text-yellow-600 border-yellow-400' },
  Approved: { label: 'Approved',   variant: 'default'    as const, className: '' },
  Rejected: { label: 'Rejected',     variant: 'secondary'  as const, className: 'text-destructive' },
}

function calcDays(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Rejected'

export function LeaveRequestsTable() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const isManager = user?.role === 'Admin' || user?.role === 'Agent'

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leaves', 'requests'],
    queryFn: async () => {
      const res = await api.get('/api/leaves/requests')
      return res.data.data
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'Approved' | 'Rejected' }) =>
      api.patch(`/api/leaves/requests/${id}/status`, { status }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      toast.success(vars.status === 'Approved' ? 'Request approved' : 'Request rejected')
    },
    onError: () => toast.error('Update failed'),
  })

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">
          {isManager ? 'All Requests' : 'My Requests'}
        </CardTitle>
        <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No requests found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isManager && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                {isManager && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => {
                const cfg = STATUS_CONFIG[req.status]
                const days = calcDays(req.date_deb, req.date_fin)
                return (
                  <TableRow key={req.id_conge}>
                    {isManager && (
                      <TableCell className="font-medium">{req.employee?.name ?? '—'}</TableCell>
                    )}
                    <TableCell className="text-muted-foreground">{req.leave_type?.name}</TableCell>
                    <TableCell>{formatDate(req.date_deb)}</TableCell>
                    <TableCell>{formatDate(req.date_fin)}</TableCell>
                    <TableCell>{days} d</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className={cfg.className}>
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    {isManager && (
                      <TableCell className="text-right space-x-1">
                        {req.status === 'Pending' ? (
                          <>
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
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
