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
import { Wallet, Check, X, ShieldAlert, Sparkles, Scale, History } from 'lucide-react'
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
    departments?: { name: string }[] // Adjusted for many-to-many
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

  const renderEmployeeView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-teal-400" />
                Request Advance
              </CardTitle>
              <CardDescription>Request a salary advance from your upcoming payslip.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5 text-teal-400" />
                    Remaining Requests
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
                    className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-md"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              ) : (
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive text-center space-y-2 leading-relaxed">
                  <ShieldAlert className="h-6 w-6 mx-auto" />
                  <p className="font-semibold">Limit Exceeded</p>
                  <p className="text-[10px] text-muted-foreground">You have already reached your 2 advances limit this year.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-400" />
                Requests History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 border-t border-border/10">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-1" />
                  <p className="font-semibold">No requests submitted yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/10">
                      <TableHead className="py-3 px-4 text-xs">Request Date</TableHead>
                      <TableHead className="py-3 px-4 text-xs">Amount</TableHead>
                      <TableHead className="py-3 px-4 text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => {
                      const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.Pending
                      return (
                        <TableRow key={r.id_massrouf} className="border-border/10 hover:bg-muted/5">
                          <TableCell className="py-3 px-4 text-sm font-medium">{formatDay(r.date_request)}</TableCell>
                          <TableCell className="py-3 px-4 text-sm font-bold font-mono">{r.amount.toLocaleString()} DZD</TableCell>
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderManagerView = () => {
    return (
      <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-indigo-400" />
            Salary Advances Administration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 border-t border-border/10">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/30 mb-1" />
              <p className="font-semibold">No requests submitted across the company.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/10">
                  <TableHead className="py-3 px-4 text-xs">Employee</TableHead>
                  <TableHead className="py-3 px-4 text-xs">Department</TableHead>
                  <TableHead className="py-3 px-4 text-xs">Request Date</TableHead>
                  <TableHead className="py-3 px-4 text-xs">Amount</TableHead>
                  <TableHead className="py-3 px-4 text-xs">Status</TableHead>
                  <TableHead className="py-3 px-4 text-xs text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.Pending
                  return (
                    <TableRow key={r.id_massrouf} className="border-border/10 hover:bg-muted/5">
                      <TableCell className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{r.employee?.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{r.employee?.email}</span>
                        </div>
                      </TableCell>
                      {/* Pre-tailored Plural Departments renderer */}
                      <TableCell className="py-3 px-4 text-xs font-semibold text-muted-foreground">
                        {r.employee?.departments?.map(d => d.name).join(', ') || '—'}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm font-medium">{formatDay(r.date_request)}</TableCell>
                      <TableCell className="py-3 px-4 text-sm font-bold font-mono">{r.amount.toLocaleString()} DZD</TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant={cfg.variant} className={`text-[10px] py-0.5 px-2 rounded-full border ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        {r.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 w-7 p-0 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
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
                        ) : (
                          <span className="text-xs text-muted-foreground/45">—</span>
                        )}
                      </TableCell>
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

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">
          {isManager ? 'Salary Advance Administration' : 'My Salary Advances (Massrouf)'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isManager ? 'Review employee advances' : 'Request advances directly to be deducted from your next payslip.'}
        </p>
      </div>
      {isManager ? renderManagerView() : renderEmployeeView()}
    </div>
  )
}
