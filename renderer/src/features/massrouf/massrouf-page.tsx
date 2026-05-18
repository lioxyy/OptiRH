import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { toast } from 'sonner'
import { Wallet, Check, X, ShieldAlert, Scale } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'

interface MassroufRequest {
  id_massrouf: number
  amount: number
  date_request: string
  status: 'Pending' | 'Approved' | 'Rejected'
  id_emp: number
  employee?: {
    name: string
    email: string
    departments?: { name: string }[]
  }
}

const STATUS_CONFIG = {
  Pending: { label: 'Pending', variant: 'outline' as const, className: 'text-amber-500 border-amber-500/30' },
  Approved: { label: 'Approved', variant: 'default' as const, className: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' },
  Rejected: { label: 'Rejected', variant: 'outline' as const, className: 'text-destructive border-destructive/30 bg-destructive/5 font-semibold' },
}

export function MassroufPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const isManager = user?.role === 'Admin' || user?.role === 'Agent'

  const { data: requests = [], isLoading } = useQuery<MassroufRequest[]>({
    queryKey: ['massrouf', 'list'],
    queryFn: async () => {
      const endpoint = isManager ? '/api/massrouf' : '/api/massrouf/my-requests'
      const res = await api.get(endpoint)
      return res.data.data
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post('/api/massrouf/request', { amount })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['massrouf'] })
      setAmount('')
      toast.success('Salary advance request submitted successfully!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Could not submit request'
      toast.error(msg)
    },
  })

  const validateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'Approved' | 'Rejected' }) => {
      const res = await api.post(`/api/massrouf/${id}/review`, { status })
      return res.data.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['massrouf'] })
      toast.success(`Advance request ${vars.status.toLowerCase()} successfully!`)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Review failed'
      toast.error(msg)
    },
  })

  const currentYear = new Date().getFullYear()
  const annualCount = requests.filter((r) => {
    const rYear = new Date(r.date_request).getFullYear()
    return rYear === currentYear && (r.status === 'Pending' || r.status === 'Approved')
  }).length
  const requestsRemaining = Math.max(0, 2 - annualCount)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive amount')
      return
    }
    submitMutation.mutate(parsedAmount)
  }

  const formatDay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }

  const employeeColumns: ColumnDef<MassroufRequest>[] = [
    {
      id: "date_request",
      accessorKey: "date_request",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Request Date" />,
      cell: ({ row }) => <span>{formatDay(row.original.date_request)}</span>
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => <span className="font-bold font-mono">{row.original.amount.toLocaleString()} DZD</span>
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const cfg = STATUS_CONFIG[row.original.status] || { label: row.original.status, variant: 'outline' as const, className: '' }
        return (
          <Badge variant={cfg.variant} className={cfg.className}>
            {cfg.label}
          </Badge>
        )
      }
    }
  ]

  const managerColumns: ColumnDef<MassroufRequest>[] = [
    {
      id: "employee",
      accessorFn: (row) => row.employee?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.original.employee?.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.employee?.email}</span>
        </div>
      )
    },
    {
      id: "department",
      accessorFn: (row) => row.employee?.departments?.map(d => d.name).join(', ') || '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
      cell: ({ row }) => (
        <span className="font-semibold text-muted-foreground">
          {row.original.employee?.departments?.map(d => d.name).join(', ') || '—'}
        </span>
      )
    },
    {
      id: "date_request",
      accessorKey: "date_request",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Request Date" />,
      cell: ({ row }) => <span>{formatDay(row.original.date_request)}</span>
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => <span className="font-bold font-mono">{row.original.amount.toLocaleString()} DZD</span>
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const cfg = STATUS_CONFIG[row.original.status] || { label: row.original.status, variant: 'outline' as const, className: '' }
        return (
          <Badge variant={cfg.variant} className={cfg.className}>
            {cfg.label}
          </Badge>
        )
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Review</div>,
      cell: ({ row }) => {
        const r = row.original
        if (r.status !== 'Pending') return <span className="text-xs text-muted-foreground/45">—</span>
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              className="h-7 w-7 p-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={validateMutation.isPending}
              onClick={() => validateMutation.mutate({ id: r.id_massrouf, status: 'Approved' })}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 w-7 p-0 rounded-lg"
              disabled={validateMutation.isPending}
              onClick={() => validateMutation.mutate({ id: r.id_massrouf, status: 'Rejected' })}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      }
    }
  ]

  const renderEmployeeView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="h-4.5 w-4.5 text-muted-foreground" />
                Request Advance
              </CardTitle>
              <CardDescription>Request a salary advance from your upcoming payslip.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-lg border bg-muted/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Scale className="h-3.5 w-3.5" />
                    Remaining Requests
                  </span>
                  <Badge variant="outline" className="font-mono">
                    {requestsRemaining} / 2 Left
                  </Badge>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(requestsRemaining / 2) * 100}%` }}
                  />
                </div>
              </div>

              {requestsRemaining > 0 ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-semibold">Advance Amount (DZD)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 15000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-9"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              ) : (
                <div className="p-4 rounded-lg border bg-destructive/5 text-xs text-destructive text-center space-y-2 leading-relaxed">
                  <ShieldAlert className="h-5 w-5 mx-auto" />
                  <p className="font-semibold">Limit Exceeded</p>
                  <p className="text-[10px] text-muted-foreground">You have already reached your 2 advances limit this year.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Card key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <GenericDataTable
              columns={employeeColumns}
              data={requests}
              searchOptions={[
                { id: "status", label: "Status" }
              ]}
            />
          )}
        </div>
      </div>
    )
  }

  const renderManagerView = () => {
    return (
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <GenericDataTable
            columns={managerColumns}
            data={requests}
            searchOptions={[
              { id: "employee", label: "Employee" },
              { id: "department", label: "Department" },
              { id: "status", label: "Status" }
            ]}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">
          {isManager ? 'Salary Advance Administration' : 'My Salary Advances (Massrouf)'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isManager ? 'Review employee advance requests.' : 'Request advances directly to be deducted from your next payslip.'}
        </p>
      </div>
      {isManager ? renderManagerView() : renderEmployeeView()}
    </div>
  )
}
