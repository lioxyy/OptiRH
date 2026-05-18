import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'
import { Wallet, Printer, FileCheck2, Calculator, Users, AlertCircle, FileText, Landmark } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'

interface Employee {
  id_emp: number
  name: string
  email: string
  role: string
  department?: { name: string }
}

interface PayrollRecord {
  id_salaire: number
  month_year: string
  bonus_amount: number
  absence_deductions: number
  amount_final: number
  status: 'Generated' | 'Validated' | 'Paid'
  id_emp: number
  id_contract: number
  employee: {
    name: string
    email: string
    role: string
    department?: { name: string }
  }
  contract: {
    type_contrat: string
    salaire_base: number
  }
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
    mutationFn: async (payload: { id_emp: number; month_year: string }) => {
      const res = await api.post('/api/payroll/generate', payload)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      setEmployeeId('')
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
    })
  }

  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedPayslip(record)
    setIsPayslipOpen(true)
  }

  const handlePrint = () => {
    window.print()
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Generate payroll form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calculator className="h-4.5 w-4.5 text-muted-foreground" />
                Calculate Salary
              </CardTitle>
              <CardDescription>
                Run automated payroll generation applying the legal formula.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Employee Select */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Target Employee
                  </label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger className="h-9 text-xs">
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

                {/* Target Period */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-semibold">Month</label>
                    <Select value={targetMonth} onValueChange={setTargetMonth}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m) => (
                          <SelectItem key={m} value={m}>
                            {new Date(2026, Number(m) - 1).toLocaleString('en-US', { month: 'short' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-semibold">Year</label>
                    <Select value={targetYear} onValueChange={setTargetYear}>
                      <SelectTrigger className="h-9 text-xs">
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

                {/* Formula warning */}
                <div className="flex gap-2.5 p-3 rounded-lg bg-muted/40 text-[10px] text-muted-foreground leading-normal border">
                  <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block mb-0.5">Deduction Service Formula</span>
                    {"$Salaire = Base - (Absences \\times \\frac{Base}{30}) - ApprovedMassroufs$"}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? 'Calculating...' : 'Run Payroll Run'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History of salary sheets */}
        <div className="lg:col-span-2 space-y-4">
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
      </div>

      {/* ── High-Fidelity Payslip (Bulletin de Paie) Modal ───────── */}
      {selectedPayslip && (
        <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
          <DialogContent className="max-w-2xl border-none bg-background text-foreground shadow-2xl rounded-xl overflow-y-auto max-h-[90vh]">
            <DialogHeader className="no-print pb-2">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Payslip Preview
              </DialogTitle>
              <DialogDescription>Review or print the employee bulletin de paie.</DialogDescription>
            </DialogHeader>

            {/* Core Bulletin Layout */}
            <div id="printable-payslip" className="p-6 bg-white text-black font-sans rounded-xl border border-gray-200 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase">OptiRH Enterprise</h2>
                  <p className="text-[10px] text-gray-500 font-mono">16, Rue des Pinèdes, Alger, Algérie</p>
                  <p className="text-[10px] text-gray-500 font-mono">NIF: 001923485693425 • RC: 16/00-3498B26</p>
                </div>
                <div className="text-right space-y-1 bg-gray-100 p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500 block">BULLETIN DE PAIE</span>
                  <span className="text-sm font-bold text-gray-800 font-mono block">Période : {selectedPayslip.month_year}</span>
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500 block">Informations Salarié</span>
                  <p className="font-bold text-gray-800 text-sm">{selectedPayslip.employee?.name}</p>
                  <p className="text-gray-600 font-medium">{selectedPayslip.employee?.role}</p>
                  <p className="text-gray-500">{selectedPayslip.employee?.department?.name ?? 'General'}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1 font-mono">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500 block">Informations Paiement</span>
                  <p className="text-gray-700 flex items-center gap-1 text-[11px] font-semibold">
                    <Landmark className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    Paiement : Virement Bancaire
                  </p>
                  <p className="text-gray-500 text-[10px]">Contrat : {selectedPayslip.contract?.type_contrat} (ID: {selectedPayslip.id_contract})</p>
                  <p className="text-gray-500 text-[10px]">Statut Paie : {selectedPayslip.status}</p>
                </div>
              </div>

              {/* Salary Breakdown Table */}
              <table className="w-full text-xs text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="py-2.5 px-3 font-extrabold text-gray-700 uppercase tracking-wider">Désignation</th>
                    <th className="py-2.5 px-3 font-extrabold text-gray-700 uppercase tracking-wider text-right">Gains (DZD)</th>
                    <th className="py-2.5 px-3 font-extrabold text-gray-700 uppercase tracking-wider text-right">Retenues (DZD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Earnings: Contract base salary */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">Salaire de Base (Contrat)</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono">{selectedPayslip.contract?.salaire_base.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-400">—</td>
                  </tr>

                  {/* Deductions: Unjustified Absences */}
                  {selectedPayslip.absence_deductions > 0 && (
                    <tr className="bg-red-50/10">
                      <td className="py-2.5 px-3 text-gray-700 font-medium">Retenue pour Absences Non Justifiées</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-400">—</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-red-600">
                        -{selectedPayslip.absence_deductions.toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {/* Deductions: Massrouf Advances */}
                  {selectedPayslip.contract?.salaire_base - selectedPayslip.absence_deductions - selectedPayslip.amount_final > 0 && (
                    (() => {
                      const totalMassrouf = selectedPayslip.contract.salaire_base - selectedPayslip.absence_deductions - selectedPayslip.amount_final;
                      if (totalMassrouf > 0.01) {
                        return (
                          <tr className="bg-red-50/10">
                            <td className="py-2.5 px-3 text-gray-700 font-medium">Remboursement Avance (Massrouf)</td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-400">—</td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono text-red-600">
                              -{totalMassrouf.toLocaleString()}
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })()
                  )}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex flex-col items-end pt-4 border-t border-gray-300 space-y-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between font-mono text-gray-600">
                    <span>Total Brut :</span>
                    <span>{selectedPayslip.contract?.salaire_base.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between font-mono text-red-600">
                    <span>Total Retenues :</span>
                    <span>
                      -{(selectedPayslip.contract?.salaire_base - selectedPayslip.amount_final).toLocaleString()} DZD
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm bg-gray-100 p-2.5 rounded-lg border border-gray-200">
                    <span className="text-gray-900 font-black">NET À PAYER :</span>
                    <span className="font-mono text-gray-950 font-black">{selectedPayslip.amount_final.toLocaleString()} DZD</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-12 text-[10px] text-gray-500 font-semibold border-t border-gray-100">
                <div className="text-center h-20 flex flex-col justify-between">
                  <span>SIGNATURE DE L'EMPLOYEUR</span>
                  <span className="text-gray-400 font-normal italic">[Cachet OptiRH]</span>
                </div>
                <div className="text-center h-20 flex flex-col justify-between">
                  <span>SIGNATURE DU SALARIÉ</span>
                  <span className="text-gray-400 font-normal italic">[Signature avec mention "Lu et approuvé"]</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <DialogFooter className="no-print pt-4 border-t border-border/10">
              <Button
                variant="ghost"
                className="h-9 text-xs"
                onClick={() => setIsPayslipOpen(false)}
              >
                Close
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs px-4 gap-1.5 shadow-sm hover:shadow-md transition-all duration-200"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                Print / Export PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
