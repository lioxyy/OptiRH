import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'
import { Plus, Archive, Briefcase } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'

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
  Active: { label: 'Active', variant: 'default' as const, className: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' },
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
      toast.success('New contract created successfully!')
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

  const columns: ColumnDef<Contract>[] = [
    {
      id: "employee",
      accessorFn: (row) => row.employee?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employee" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.original.employee?.name ?? '—'}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.employee?.email}</span>
        </div>
      )
    },
    {
      id: "type",
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <span className="font-semibold text-muted-foreground">{row.original.type}</span>
    },
    {
      id: "salaire_base",
      accessorKey: "salaire_base",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Base Salary" />,
      cell: ({ row }) => <span className="font-bold font-mono">{row.original.salaire_base.toLocaleString()} DZD</span>
    },
    {
      id: "date_deb",
      accessorKey: "date_deb",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
      cell: ({ row }) => <span>{formatDay(row.original.date_deb)}</span>
    },
    {
      id: "date_fin",
      accessorKey: "date_fin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
      cell: ({ row }) => <span>{formatDay(row.original.date_fin)}</span>
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
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center justify-end">
            {c.status === 'Active' ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 gap-1"
                disabled={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate(c.id_contract)}
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground/35 select-none">—</span>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Employee Contracts</h1>
          <p className="text-muted-foreground text-sm">
            Manage official employee agreements, base salaries, and history.
          </p>
        </div>

        {/* Create new contract trigger button & filter */}
        <div className="flex items-center gap-3 no-print">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              <SelectItem value="Active">Active Only</SelectItem>
              <SelectItem value="Archived">Archived Only</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 gap-1.5 text-xs px-4">
                <Plus className="h-4 w-4" />
                New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg border-none bg-background shadow-2xl rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
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
                    className="h-9 text-xs px-4 shadow-sm"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Issue Contract'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Card key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <GenericDataTable
            columns={columns}
            data={filteredContracts}
            searchOptions={[
              { id: "employee", label: "Employee" },
              { id: "type", label: "Contract Type" }
            ]}
          />
        )}
      </div>
    </div>
  )
}
