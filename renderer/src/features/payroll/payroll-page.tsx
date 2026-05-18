import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'
import { Columns, Wallet, Calculator, Users, AlertCircle, History, FileCheck2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { PayslipModal, PayrollRecord } from './shared/payslip-modal'

interface Employee {
  id_emp: number
  name: string
  email: string
  role: string
  department?: { name: string }
}

const STATUS_CONFIG = {
  Generated: { label: 'Generated', variant: 'outline' as const, className: 'text-blue-500 border-blue-500/30' },
  Validated: { label: 'Validated', variant: 'outline' as const, className: 'text-amber-500 border-amber-500/30' },
  Paid: { label: 'Paid', variant: 'default' as const, className: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' },
}

export function PayrollPage() {
  const queryClient = useQueryClient()
  const [employeeId, setEmployeeId] = useState('')
  const [targetMonth, setTargetMonth] = useState('05')
  const [targetYear, setTargetYear] = useState('2026')
  const [bonusAmount, setBonusAmount] = useState('0')
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null)
  const [isPayslipOpen, setIsPayslipOpen] = useState(false)

  // Query all generated payroll records
  const { data: payHistory = [], isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ['payroll', 'history'],
    queryFn: async () => {
      const res = await api.get('/api/payroll/history')
      return res.data.data
    },
  })

  // Query active employees for selection
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/api/employees')
      return res.data.data
    },
  })

  // Generate payroll mutation
  const generateMutation = useMutation({
    mutationFn: async (payload: { id_emp: number; month_year: string; bonus_amount: number }) => {
      const res = await api.post('/api/payroll/generate', payload)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      setEmployeeId('')
      setBonusAmount('0')
      toast.success('Monthly payroll sheet generated successfully!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Could not calculate payroll'
      toast.error(msg)
    },
  })

  // Transition status mutation (Validate / Mark Paid)
  const transitionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'Validated' | 'Paid' }) => {
      const res = await api.post(`/api/payroll/${id}/validate`, { status })
      return res.data.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      toast.success(`Payslip marked as ${vars.status.toLowerCase()} successfully!`)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Transition failed'
      toast.error(msg)
    },
  })

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId) {
      toast.error('Please select an employee')
      return
    }

    const month_year = `${targetMonth}-${targetYear}`
    generateMutation.mutate({
      id_emp: Number(employeeId),
      month_year,
      bonus_amount: Number(bonusAmount) || 0,
    })
  }

  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedPayslip(record)
    setIsPayslipOpen(true)
  }


  const columns: ColumnDef<PayrollRecord>[] = [
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
      id: "month_year",
      accessorKey: "month_year",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
      cell: ({ row }) => <span className="font-semibold text-muted-foreground">{row.original.month_year}</span>
    },
    {
      id: "amount_final",
      accessorKey: "amount_final",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Net Salary" />,
      cell: ({ row }) => <span className="font-bold font-mono">{row.original.amount_final.toLocaleString()} DZD</span>
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
        const p = row.original
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleViewPayslip(p)}
            >
              View Payslip
            </Button>

            {p.status === 'Generated' && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1"
                onClick={() => transitionMutation.mutate({ id: p.id_salaire, status: 'Validated' })}
                disabled={transitionMutation.isPending}
              >
                <FileCheck2 className="h-3 w-3" />
                Validate
              </Button>
            )}

            {p.status === 'Validated' && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                onClick={() => transitionMutation.mutate({ id: p.id_salaire, status: 'Paid' })}
                disabled={transitionMutation.isPending}
              >
                <Wallet className="h-3 w-3" />
                Mark Paid
              </Button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payroll Administration</h1>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Payroll History
            </TabsTrigger>
            <TabsTrigger value="calculate" className="gap-2">
              <Calculator className="h-4 w-4" />
              Calculate Salary
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Card key={i} className="h-14 w-full" />)}
              </div>
            ) : (
              <GenericDataTable
                columns={columns}
                data={payHistory}
                searchOptions={[
                  { id: "employee", label: "Employee" },
                  { id: "month_year", label: "Period" },
                  { id: "status", label: "Status" }
                ]}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="calculate">
          <div className="max-w-xl">
            <Card className="border-2 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-500" />
                  Salary Calculation Engine
                </CardTitle>
                <CardDescription>
                  Generate high-fidelity payroll records for individual employees applying legal proration and deduction formulas.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleGenerate} className="space-y-6">
                  {/* Employee Select */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 px-1">
                      <Users className="h-3.5 w-3.5" />
                      1. Select Target Employee
                    </label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger className="h-11 shadow-none transition-all focus:ring-2 focus:ring-indigo-500/20">
                        <SelectValue placeholder="Search or select employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id_emp} value={String(emp.id_emp)} className="py-2.5">
                            <div className="flex flex-col">
                              <span className="font-semibold">{emp.name}</span>
                              <span className="text-[10px] opacity-70 font-mono italic">{emp.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Period */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 px-1">
                      <Columns className="h-3.5 w-3.5" />
                      2. Define Payment Period
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground ml-1">Month</span>
                        <Select value={targetMonth} onValueChange={setTargetMonth}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => (
                              <SelectItem key={m} value={m}>
                                {new Date(2026, Number(m) - 1).toLocaleString('en-US', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground ml-1">Year</span>
                        <Select value={targetYear} onValueChange={setTargetYear}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['2025', '2026', '2027'].map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Formula warning */}
                  <div className="flex gap-4 p-4 rounded-xl bg-indigo-50/10 border border-indigo-500/20 text-xs text-muted-foreground leading-relaxed">
                    <div className="bg-indigo-500/10 h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground block mb-1 text-sm">Automated Deduction Formula</span>
                      <p className="opacity-80">
                        The system will automatically calculate pro-rated days based on contract status, apply deductions for unjustified absences, and settle approved massrouf advances.
                      </p>
                      <code className="block mt-2 font-mono text-[10px] bg-background/50 p-2 rounded border text-indigo-400">
                        {"$Salaire = Base - (Absences \\times \\frac{Base}{WorkingDays}) - Massrouf$"}
                      </code>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20"
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? 'Executing Engine...' : 'Run Payroll Run'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── High-Fidelity Payslip Modal ───────── */}
      {selectedPayslip && (
        <PayslipModal
          record={selectedPayslip}
          open={isPayslipOpen}
          onClose={() => {
            setIsPayslipOpen(false)
            setSelectedPayslip(null)
          }}
        />
      )}
    </div>
  )
}
