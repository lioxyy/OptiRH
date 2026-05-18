import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'
import { FileText, Plus, Archive, Briefcase } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'

interface Employee {
  id_emp: number
  name: string
}

interface Contract {
  id_contract: number
  type: string
  date_deb: string
  date_fin: string | null
  salaire_base: number
  status: 'Active' | 'Archived'
  id_emp: number
  employee: {
    name: string
    email: string
  }
}

const STATUS_CONFIG = {
  Active: { label: 'Active', variant: 'default' as const, className: 'bg-emerald-500 hover:bg-emerald-600 text-white font-semibold' },
  Archived: { label: 'Archived', variant: 'outline' as const, className: 'text-muted-foreground border-border bg-muted/20 font-semibold' },
}

export function ContractsPage() {
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [type, setType] = useState('CDI')
  const [salary, setSalary] = useState('')
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Archived'>('Active')

  // Query all contracts
  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['contracts', 'list'],
    queryFn: async () => {
      const res = await api.get('/api/contracts')
      return res.data.data
    },
  })

  // Query employees for selector in form
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  // Create contract mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/api/contracts', payload)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      setIsAddOpen(false)
      setEmployeeId('')
      setSalary('')
      setEndDate('')
      toast.success('New contract created successfully! Any prior active contract for this employee was soft-archived.')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Could not create contract'
      toast.error(msg)
    },
  })

  // Archive contract mutation (soft-archiving)
  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/api/contracts/${id}/archive`)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('Contract archived successfully!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Archiving failed'
      toast.error(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId) {
      toast.error('Please select an employee')
      return
    }
    const parsedSalary = parseFloat(salary)
    if (isNaN(parsedSalary) || parsedSalary <= 0) {
      toast.error('Please enter a valid salary amount')
      return
    }

    createMutation.mutate({
      id_emp: Number(employeeId),
      type: type,
      salaire_base: parsedSalary,
      date_deb: new Date(startDate).toISOString(),
      date_fin: endDate ? new Date(endDate).toISOString() : null,
    })
  }

  const formatDay = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  }

  // Apply filters on client-side
  const filteredContracts = contracts.filter((c) => {
    if (statusFilter === 'all') return true
    return c.status === statusFilter
  })

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Employee Contracts Hub
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage official employee agreements, base salaries, and soft-archived histories.
          </p>
        </div>

        {/* Create new contract trigger button */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 text-xs px-4 gap-1.5 shadow-md hover:shadow-lg transition-all duration-200">
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg border-border/40 bg-card/90 backdrop-blur-xl shadow-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-400" />
                Create New Contract
              </DialogTitle>
              <DialogDescription>
                Assign a base salary and formal employment term. Creating a new contract will automatically archive
                the employee's previous active agreement.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-3">
              {/* Select Employee */}
              <div className="grid grid-cols-4 items-center gap-4 text-xs font-semibold text-muted-foreground">
                <label className="text-right">Employee</label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="col-span-3 h-9 text-xs rounded-lg">
                    <SelectValue placeholder="Select Employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id_emp} value={String(emp.id_emp)}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Contract Type */}
              <div className="grid grid-cols-4 items-center gap-4 text-xs font-semibold text-muted-foreground">
                <label className="text-right">Contract Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="col-span-3 h-9 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI (Permanent)</SelectItem>
                    <SelectItem value="CDD">CDD (Fixed-Term)</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Trial">Trial Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Base Salary */}
              <div className="grid grid-cols-4 items-center gap-4 text-xs font-semibold text-muted-foreground">
                <label className="text-right">Base Salary (DZD)</label>
                <Input
                  type="number"
                  placeholder="e.g. 75000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="col-span-3 rounded-lg h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              {/* Start Date */}
              <div className="grid grid-cols-4 items-center gap-4 text-xs font-semibold text-muted-foreground">
                <label className="text-right">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="col-span-3 rounded-lg h-9 text-xs"
                  required
                />
              </div>

              {/* End Date */}
              <div className="grid grid-cols-4 items-center gap-4 text-xs font-semibold text-muted-foreground">
                <label className="text-right">End Date (CDD only)</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="col-span-3 rounded-lg h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-lg h-9 text-xs"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-xs px-4 shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Issue Contract'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contracts filter & table */}
      <Card className="border-border/40 bg-card/30 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              Contracts Roster
            </CardTitle>
            <CardDescription>Browse historical and active official agreements.</CardDescription>
          </div>

          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-36 h-8 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              <SelectItem value="Active">Active Only</SelectItem>
              <SelectItem value="Archived">Archived Only</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="p-0 border-t border-border/10">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-1 animate-bounce" />
              <p className="text-sm font-semibold text-muted-foreground">No contracts found.</p>
              <p className="text-xs text-muted-foreground/60">Issue a new contract to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="border-border/10">
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Employee</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Type</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Base Salary</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Start Date</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">End Date</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="py-3 px-4 font-semibold text-xs text-muted-foreground text-right">Archive</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((c) => {
                    const cfg = STATUS_CONFIG[c.status] || {
                      label: c.status,
                      variant: 'outline' as const,
                      className: '',
                    }
                    return (
                      <TableRow key={c.id_contract} className="border-border/10 hover:bg-muted/5 transition-all duration-150">
                        <TableCell className="py-3 px-4 font-semibold">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{c.employee?.name ?? '—'}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{c.employee?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm font-semibold text-muted-foreground">{c.type}</TableCell>
                        <TableCell className="py-3 px-4 text-sm font-bold text-foreground font-mono">
                          {c.salaire_base.toLocaleString()} DZD
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm font-medium">{formatDay(c.date_deb)}</TableCell>
                        <TableCell className="py-3 px-4 text-sm font-medium">{formatDay(c.date_fin)}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant={cfg.variant} className={`text-[10px] py-0.5 px-2 rounded-full border ${cfg.className}`}>
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          {c.status === 'Active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs rounded-lg text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 gap-1"
                              disabled={archiveMutation.isPending}
                              onClick={() => archiveMutation.mutate(c.id_contract)}
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground/35 select-none">—</span>
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
    </div>
  )
}
