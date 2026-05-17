import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { toast } from 'sonner'
import { Wallet, Check, X, ShieldAlert, Sparkles, Scale, Info, History } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'

interface MassroufRequest {
  id_massrouf: number
  amount: number
  date_request: string
  status: 'Pending' | 'Approved' | 'Rejected'
  id_emp: number
  employee?: {
    name: string
    email: string
    department?: { name: string }
  }
}

const STATUS_CONFIG = {
  Pending: { label: 'Pending', variant: 'outline' as const, className: 'text-amber-500 border-amber-500/30 bg-amber-500/5 font-semibold' },
  Approved: { label: 'Approved', variant: 'default' as const, className: 'bg-emerald-500 hover:bg-emerald-600 text-white font-semibold' },
  Rejected: { label: 'Rejected', variant: 'outline' as const, className: 'text-destructive border-destructive/30 bg-destructive/5 font-semibold' },
}

export function MassroufPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const isManager = user?.role === 'Admin' || user?.role === 'Agent'

  // Query salary advance requests (for Managers: all, for Employees: own history)
  const { data: requests = [], isLoading } = useQuery<MassroufRequest[]>({
    queryKey: ['massrouf', 'list'],
    queryFn: async () => {
      const endpoint = isManager ? '/api/massrouf' : '/api/massrouf/my-requests'
      const res = await api.get(endpoint)
      return res.data.data
    },
  })

  // Submit request mutation (Employee)
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

  // Validate request mutation (Admin/Agent)
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

  // Calculate annual counts (Limit: 2 per year)
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  }

  /* ── Employee View ────────────────────────────────────────────── */
  const renderEmployeeView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Submit request form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-border/60">
            <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-teal-400" />
                Request Advance
              </CardTitle>
              <CardDescription>Request a salary advance from your upcoming payslip.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Annual limits visualizer */}
              <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-teal-400" />
                    Annual Remaining Requests
                  </span>
                  <Badge variant="outline" className="text-teal-400 border-teal-500/30 font-mono">
                    {requestsRemaining} / 2 Left
                  </Badge>
                </div>
                <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(requestsRemaining / 2) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <Info className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                  Employees can request at most twice a year according to regulations.
                </p>
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
                      className="rounded-xl h-10 border-border/60 text-sm font-semibold"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              ) : (
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive text-center space-y-2 leading-relaxed font-medium">
                  <ShieldAlert className="h-6 w-6 mx-auto" />
                  <p>Limit Exceeded</p>
                  <p className="text-[10px] text-muted-foreground font-normal">
                    You have already requested or received 2 advances this calendar year. You cannot request more at this time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-400" />
                Requests History
              </CardTitle>
              <CardDescription>Track the review progress of your requested advances.</CardDescription>
            </CardHeader>

            <CardContent className="p-0 border-t border-border/10">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-11 w-full rounded-lg" />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm space-y-1">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-1" />
                  <p className="font-semibold">No requests submitted yet.</p>
                  <p className="text-xs text-muted-foreground/60">Any requests you make will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="border-border/10">
                        <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Request Date</TableHead>
                        <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Amount Requested</TableHead>
                        <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((r) => {
                        const cfg = STATUS_CONFIG[r.status] || {
                          label: r.status,
                          variant: 'outline' as const,
                          className: '',
                        }
                        return (
                          <TableRow key={r.id_massrouf} className="border-border/10 hover:bg-muted/5 transition-all duration-150">
                            <TableCell className="py-3 px-4 text-sm font-medium">{formatDay(r.date_request)}</TableCell>
                            <TableCell className="py-3 px-4 text-sm font-bold text-foreground font-mono">
                              {r.amount.toLocaleString()} DZD
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <Badge variant={cfg.variant} className={`text-[10px] py-0.5 px-2 rounded-full border ${cfg.className}`}>
                                {cfg.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  /* ── Admin / Agent View ──────────────────────────────────────── */
  const renderManagerView = () => {
    return (
      <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-indigo-400" />
            Salary Advances Requests (Massrouf)
          </CardTitle>
          <CardDescription>Manage and review monthly payroll advance requests from employees.</CardDescription>
        </CardHeader>

        <CardContent className="p-0 border-t border-border/10">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm space-y-1">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-1" />
              <p className="font-semibold">No requests submitted across the company.</p>
              <p className="text-xs text-muted-foreground/60">New employee submissions will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-border/10">
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Employee</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Department</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Request Date</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Amount</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground text-right">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => {
                    const cfg = STATUS_CONFIG[r.status] || {
                      label: r.status,
                      variant: 'outline' as const,
                      className: '',
                    }
                    return (
                      <TableRow key={r.id_massrouf} className="border-border/10 hover:bg-muted/5 transition-all duration-150">
                        <TableCell className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{r.employee?.name ?? '—'}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{r.employee?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-xs font-semibold text-muted-foreground">
                          {r.employee?.department?.name ?? '—'}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm font-medium">{formatDay(r.date_request)}</TableCell>
                        <TableCell className="py-3 px-4 text-sm font-bold text-foreground font-mono">
                          {r.amount.toLocaleString()} DZD
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant={cfg.variant} className={`text-[10px] py-0.5 px-2 rounded-full border ${cfg.className}`}>
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          {r.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5 animate-in fade-in duration-200">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 w-7 p-0 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                                disabled={validateMutation.isPending}
                                onClick={() => validateMutation.mutate({ id: r.id_massrouf, status: 'Approved' })}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 w-7 p-0 rounded-lg shadow-sm"
                                disabled={validateMutation.isPending}
                                onClick={() => validateMutation.mutate({ id: r.id_massrouf, status: 'Rejected' })}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/45 select-none">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">
          {isManager ? 'Salary Advance Administration' : 'My Salary Advances (Massrouf)'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isManager
            ? 'Review and manage employee payroll advance limits and active approvals.'
            : 'Request mid-month salary advances directly to be deducted from your next payslip.'}
        </p>
      </div>

      {isManager ? renderManagerView() : renderEmployeeView()}
    </div>
  )
}
