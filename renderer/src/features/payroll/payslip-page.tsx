import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { ReceiptText, Printer, Landmark } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'

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
    departments?: { name: string }[]
  }
  contract: {
    type: string
    salaire_base: number
  }
}

const STATUS_CONFIG = {
  Generated: { label: 'Generated', className: 'text-blue-500 border-blue-500/30' },
  Validated: { label: 'Validated', className: 'text-amber-500 border-amber-500/30' },
  Paid:      { label: 'Paid',      className: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' },
}

function PayslipModal({ record, open, onClose }: { record: PayrollRecord; open: boolean; onClose: () => void }) {
  const totalDeductions = (record.contract?.salaire_base ?? 0) - record.amount_final
  const massroufDeduction = Math.max(0, totalDeductions - record.absence_deductions)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-none bg-background text-foreground shadow-2xl rounded-xl overflow-y-auto max-h-[92vh]">
        <DialogHeader className="no-print pb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
            Bulletin de Paie — {record.month_year}
          </DialogTitle>
          <DialogDescription>Official payslip for period {record.month_year}</DialogDescription>
        </DialogHeader>

        {/* ── Printable Payslip ── */}
        <div id="printable-payslip" className="p-6 bg-white text-black font-sans rounded-xl border border-gray-200 space-y-5">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
            <div className="space-y-0.5">
              <h2 className="text-xl font-black tracking-tight text-gray-900 uppercase">OptiRH Enterprise</h2>
              <p className="text-[10px] text-gray-500 font-mono">16, Rue des Pinèdes, Alger, Algérie</p>
              <p className="text-[10px] text-gray-500 font-mono">NIF: 001923485693425 • RC: 16/00-3498B26</p>
            </div>
            <div className="text-right bg-gray-100 p-2.5 rounded-lg border border-gray-200 space-y-0.5">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-gray-500 block">BULLETIN DE PAIE</span>
              <span className="text-sm font-bold text-gray-800 font-mono block">Période : {record.month_year}</span>
              <span className="text-[10px] text-gray-500 font-mono block">Réf. #{record.id_salaire.toString().padStart(5, '0')}</span>
            </div>
          </div>

          {/* Employee & Payment Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Informations Salarié</span>
              <p className="font-bold text-gray-900 text-sm">{record.employee?.name}</p>
              <p className="text-gray-600 font-medium">{record.employee?.role}</p>
              <p className="text-gray-500">
                {record.employee?.departments?.map(d => d.name).join(', ') || 'General'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1 font-mono">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Informations Paiement</span>
              <p className="text-gray-700 text-[11px] font-semibold flex items-center gap-1">
                <Landmark className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                Virement Bancaire
              </p>
              <p className="text-gray-500 text-[10px]">Contrat : {record.contract?.type} — Base : {record.contract?.salaire_base?.toLocaleString()} DZD</p>
              <p className="text-gray-500 text-[10px]">Statut Paie : {record.status}</p>
            </div>
          </div>

          {/* Salary Breakdown Table */}
          <table className="w-full text-xs border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="py-2.5 px-3 text-left font-extrabold text-gray-700 uppercase tracking-wider">Désignation</th>
                <th className="py-2.5 px-3 text-right font-extrabold text-gray-700 uppercase tracking-wider">Gains (DZD)</th>
                <th className="py-2.5 px-3 text-right font-extrabold text-gray-700 uppercase tracking-wider">Retenues (DZD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-gray-800">Salaire de Base (Contrat)</td>
                <td className="py-2.5 px-3 text-right font-bold font-mono">{record.contract?.salaire_base?.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
              </tr>
              {record.bonus_amount > 0 && (
                <tr>
                  <td className="py-2.5 px-3 text-gray-700 font-medium">Prime / Bonus</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-600">+{record.bonus_amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                </tr>
              )}
              {record.absence_deductions > 0 && (
                <tr className="bg-red-50/30">
                  <td className="py-2.5 px-3 text-gray-700 font-medium">Retenue — Absences Non Justifiées</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-red-600 font-semibold">-{record.absence_deductions.toLocaleString()}</td>
                </tr>
              )}
              {massroufDeduction > 0.01 && (
                <tr className="bg-orange-50/30">
                  <td className="py-2.5 px-3 text-gray-700 font-medium">Remboursement Avance (Massrouf)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-orange-600 font-semibold">-{massroufDeduction.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 font-mono">
                <span>Total Brut :</span>
                <span>{((record.contract?.salaire_base ?? 0) + record.bonus_amount).toLocaleString()} DZD</span>
              </div>
              {totalDeductions > 0 && (
                <div className="flex justify-between text-red-600 font-mono">
                  <span>Total Retenues :</span>
                  <span>-{totalDeductions.toLocaleString()} DZD</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm bg-gray-900 text-white p-2.5 rounded-lg">
                <span className="font-black">NET À PAYER :</span>
                <span className="font-mono font-black">{record.amount_final.toLocaleString()} DZD</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-10 border-t border-gray-100 text-[10px] text-gray-500 font-semibold">
            <div className="text-center space-y-12">
              <span>SIGNATURE DE L'EMPLOYEUR</span>
              <div className="border-t border-gray-300 pt-1 text-gray-400 font-normal italic">[Cachet OptiRH]</div>
            </div>
            <div className="text-center space-y-12">
              <span>SIGNATURE DU SALARIÉ</span>
              <div className="border-t border-gray-300 pt-1 text-gray-400 font-normal italic">[Lu et approuvé]</div>
            </div>
          </div>
        </div>

        <DialogFooter className="no-print pt-4 border-t border-border/10 gap-2">
          <Button variant="ghost" className="rounded-lg h-9 text-xs" onClick={onClose}>Close</Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-xs px-4 gap-1.5 shadow-sm"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PayslipPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin' || user?.role === 'Agent'

  const [filterYear, setFilterYear] = useState('2026')
  const [filterEmpId, setFilterEmpId] = useState<string>(isAdmin ? 'all' : String(user?.id_emp ?? ''))
  const [selected, setSelected] = useState<PayrollRecord | null>(null)

  const { data: employees = [] } = useQuery<{ id_emp: number; name: string }[]>({
    queryKey: ['employees'],
    queryFn: async () => (await api.get('/api/employees')).data.data,
    enabled: isAdmin,
  })

  const { data: allRecords = [], isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ['payroll', 'history', filterEmpId, filterYear],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterEmpId && filterEmpId !== 'all') params.append('id_emp', filterEmpId)
      const res = await api.get(`/api/payroll/history?${params.toString()}`)
      return res.data.data
    },
  })

  const records = allRecords.filter(r => r.month_year.endsWith(filterYear))

  const totalNet    = records.reduce((s, r) => s + r.amount_final, 0)
  const totalDeduct = records.reduce((s, r) => s + r.absence_deductions, 0)
  const paidCount   = records.filter(r => r.status === 'Paid').length
  const avgSalary   = records.length > 0 ? Math.round(totalNet / records.length) : 0

  const columns: ColumnDef<PayrollRecord>[] = [
    ...(isAdmin ? [
      {
        id: "employee",
        accessorFn: (row: PayrollRecord) => row.employee?.name ?? '—',
        header: ({ column }: { column: any }) => <DataTableColumnHeader column={column} title="Employee" />,
        cell: ({ row }: { row: any }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.employee?.name ?? '—'}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {row.original.employee?.departments?.map((d: any) => d.name).join(', ') || 'General'}
            </span>
          </div>
        )
      }
    ] : []),
    {
      id: "month_year",
      accessorKey: "month_year",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
      cell: ({ row }) => <span className="font-semibold text-muted-foreground">{row.original.month_year}</span>
    },
    {
      id: "base_salary",
      accessorFn: (row) => row.contract?.salaire_base ?? 0,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Base Salary" />,
      cell: ({ row }) => <span className="font-mono">{row.original.contract?.salaire_base?.toLocaleString()} DZD</span>
    },
    {
      id: "deductions",
      accessorFn: (row) => (row.contract?.salaire_base ?? 0) - row.amount_final,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Deductions" />,
      cell: ({ row }) => {
        const totalDeductions = (row.original.contract?.salaire_base ?? 0) - row.original.amount_final
        return (
          <span className={`font-mono ${totalDeductions > 0 ? 'text-rose-500 font-semibold' : 'text-muted-foreground'}`}>
            {totalDeductions > 0 ? `-${totalDeductions.toLocaleString()} DZD` : '0 DZD'}
          </span>
        )
      }
    },
    {
      id: "amount_final",
      accessorKey: "amount_final",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Net Salary" />,
      cell: ({ row }) => <span className="font-bold font-mono text-foreground">{row.original.amount_final.toLocaleString()} DZD</span>
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const cfg = STATUS_CONFIG[row.original.status] || { label: row.original.status, className: '' }
        return (
          <Badge variant="outline" className={`text-[10px] py-0.5 px-2 rounded-full border ${cfg.className}`}>
            {cfg.label}
          </Badge>
        )
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setSelected(r)}
            >
              View Payslip
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-payslip, #printable-payslip * { visibility: visible; }
          #printable-payslip { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">My Payslips</h1>
        <p className="text-muted-foreground text-sm">Consult your salary breakdown and payment history.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center no-print">
        {isAdmin && (
          <Select value={filterEmpId} onValueChange={setFilterEmpId}>
            <SelectTrigger className="h-9 text-xs w-48">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map(e => (
                <SelectItem key={e.id_emp} value={String(e.id_emp)}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="h-9 text-xs w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['2024', '2025', '2026', '2027'].map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Net Paid', value: `${totalNet.toLocaleString()} DZD` },
          { label: 'Avg Monthly Salary', value: `${avgSalary.toLocaleString()} DZD` },
          { label: 'Total Deductions', value: totalDeduct > 0 ? `-${totalDeduct.toLocaleString()} DZD` : '0 DZD' },
          { label: 'Paid Payslips', value: `${paidCount} / ${records.length}` },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <GenericDataTable
            columns={columns}
            data={records}
            searchOptions={[
              ...(isAdmin ? [{ id: "employee", label: "Employee" }] : []),
              { id: "month_year", label: "Period" },
              { id: "status", label: "Status" }
            ]}
          />
        )}
      </div>

      {selected && <PayslipModal record={selected} open={!!selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
