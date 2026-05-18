import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Skeleton } from '../../components/ui/skeleton'
import {
  FileText, Printer, TrendingUp, TrendingDown, Wallet,
  Landmark, Calendar, ReceiptText, BadgeCheck, Clock3, ChevronRight,
  BarChart3, AlertCircle
} from 'lucide-react'

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
    type: string
    salaire_base: number
  }
}

const STATUS_CONFIG = {
  Generated: { label: 'Generated', className: 'text-blue-400 border-blue-500/30 bg-blue-500/5', icon: Clock3 },
  Validated: { label: 'Validated', className: 'text-amber-400 border-amber-500/30 bg-amber-500/5', icon: BadgeCheck },
  Paid:      { label: 'Paid',      className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5', icon: Wallet },
}

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
]

function PayslipModal({ record, open, onClose }: { record: PayrollRecord; open: boolean; onClose: () => void }) {
  const totalDeductions = (record.contract?.salaire_base ?? 0) - record.amount_final
  const massroufDeduction = Math.max(0, totalDeductions - record.absence_deductions)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-none bg-background text-foreground shadow-2xl rounded-2xl overflow-y-auto max-h-[92vh]">
        <DialogHeader className="no-print pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-violet-400" />
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
              <p className="text-gray-500">{record.employee?.department?.name ?? 'General'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1 font-mono">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Informations Paiement</span>
              <p className="text-gray-700 text-[11px] font-semibold flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-gray-400 rounded-sm mr-0.5" />
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
              {/* Base Salary */}
              <tr>
                <td className="py-2.5 px-3 font-semibold text-gray-800">Salaire de Base (Contrat)</td>
                <td className="py-2.5 px-3 text-right font-bold font-mono">{record.contract?.salaire_base?.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
              </tr>
              {/* Bonus */}
              {record.bonus_amount > 0 && (
                <tr>
                  <td className="py-2.5 px-3 text-gray-700 font-medium">Prime / Bonus</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-600">+{record.bonus_amount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                </tr>
              )}
              {/* Absence Deduction */}
              {record.absence_deductions > 0 && (
                <tr className="bg-red-50/30">
                  <td className="py-2.5 px-3 text-gray-700 font-medium">Retenue — Absences Non Justifiées</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-red-600">-{record.absence_deductions.toLocaleString()}</td>
                </tr>
              )}
              {/* Massrouf Deduction */}
              {massroufDeduction > 0.01 && (
                <tr className="bg-orange-50/30">
                  <td className="py-2.5 px-3 text-gray-700 font-medium">Remboursement Avance sur Salaire (Massrouf)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-300">—</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-orange-600">-{massroufDeduction.toLocaleString()}</td>
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

          {/* Signature strip */}
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
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg h-9 text-xs px-4 gap-1.5 shadow-md hover:shadow-lg"
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

  // Fetch all employees (admin only)
  const { data: employees = [] } = useQuery<{ id_emp: number; name: string }[]>({
    queryKey: ['employees'],
    queryFn: async () => (await api.get('/api/employees')).data.data,
    enabled: isAdmin,
  })

  // Fetch payroll history
  const { data: allRecords = [], isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ['payroll', 'history', filterEmpId, filterYear],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterEmpId && filterEmpId !== 'all') params.append('id_emp', filterEmpId)
      const res = await api.get(`/api/payroll/history?${params.toString()}`)
      return res.data.data
    },
  })

  // Filter by year client-side
  const records = allRecords.filter(r => r.month_year.endsWith(filterYear))

  // Stats
  const totalNet    = records.reduce((s, r) => s + r.amount_final, 0)
  const totalDeduct = records.reduce((s, r) => s + r.absence_deductions, 0)
  const paidCount   = records.filter(r => r.status === 'Paid').length
  const avgSalary   = records.length > 0 ? Math.round(totalNet / records.length) : 0

  // Month name helper
  const monthName = (my: string) => {
    const [mm] = my.split('-')
    return MONTHS.find(m => m.value === mm)?.label ?? my
  }

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-300">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-payslip, #printable-payslip * { visibility: visible; }
          #printable-payslip { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
          My Payslips
        </h1>
        <p className="text-muted-foreground text-sm">
          Consult your salary breakdown, deductions, and full payment history.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center no-print">
        {isAdmin && (
          <Select value={filterEmpId} onValueChange={setFilterEmpId}>
            <SelectTrigger className="h-9 text-xs rounded-xl w-48 border-border/60">
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
          <SelectTrigger className="h-9 text-xs rounded-xl w-32 border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['2024', '2025', '2026', '2027'].map(y => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Net Paid',
            value: `${totalNet.toLocaleString()} DZD`,
            icon: Wallet,
            color: 'from-violet-500/20 to-purple-500/10',
            iconColor: 'text-violet-400',
            trend: null,
          },
          {
            label: 'Avg Monthly Salary',
            value: `${avgSalary.toLocaleString()} DZD`,
            icon: BarChart3,
            color: 'from-blue-500/20 to-indigo-500/10',
            iconColor: 'text-blue-400',
            trend: null,
          },
          {
            label: 'Total Deductions',
            value: totalDeduct > 0 ? `-${totalDeduct.toLocaleString()} DZD` : '0 DZD',
            icon: TrendingDown,
            color: 'from-rose-500/20 to-red-500/10',
            iconColor: 'text-rose-400',
            trend: null,
          },
          {
            label: 'Paid Payslips',
            value: `${paidCount} / ${records.length}`,
            icon: BadgeCheck,
            color: 'from-emerald-500/20 to-teal-500/10',
            iconColor: 'text-emerald-400',
            trend: null,
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/40 bg-card/30 backdrop-blur-xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-60 pointer-events-none`} />
            <CardContent className="p-4 relative flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-background/60 border border-border/30`}>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{kpi.label}</p>
                <p className="text-lg font-black text-foreground leading-tight">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payslip History Grid */}
      <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-400" />
            Salary History — {filterYear}
          </CardTitle>
          <CardDescription>Click any row to view the full bulletin de paie.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t border-border/10">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/20" />
              <p className="font-semibold">No payslips found for {filterYear}</p>
              <p className="text-xs text-muted-foreground/60">Payslips will appear here once payroll is generated by your HR administrator.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {records.map((record) => {
                const cfg = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.Generated
                const StatusIcon = cfg.icon
                const deductionTotal = (record.contract?.salaire_base ?? 0) - record.amount_final
                const deductPct = record.contract?.salaire_base > 0
                  ? Math.round((deductionTotal / record.contract.salaire_base) * 100)
                  : 0

                return (
                  <div
                    key={record.id_salaire}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/5 cursor-pointer transition-all group"
                    onClick={() => setSelected(record)}
                  >
                    {/* Month badge */}
                    <div className="w-16 flex-shrink-0 text-center">
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-2">
                        <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">
                          {record.month_year.split('-')[0]}
                        </p>
                        <p className="text-xs font-black text-foreground leading-none">
                          {monthName(record.month_year).slice(0, 3)}
                        </p>
                      </div>
                    </div>

                    {/* Employee name (admin view) */}
                    {isAdmin && (
                      <div className="w-32 flex-shrink-0">
                        <p className="text-xs font-bold text-foreground truncate">{record.employee?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{record.employee?.department?.name ?? '—'}</p>
                      </div>
                    )}

                    {/* Salary breakdown bar */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Base: {record.contract?.salaire_base?.toLocaleString()} DZD</span>
                        {deductionTotal > 0 && (
                          <span className="text-rose-400 flex items-center gap-0.5">
                            <TrendingDown className="h-3 w-3" />
                            -{deductionTotal.toLocaleString()} DZD ({deductPct}%)
                          </span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(10, 100 - deductPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Net amount */}
                    <div className="text-right w-32 flex-shrink-0">
                      <p className="text-base font-black text-foreground font-mono">
                        {record.amount_final.toLocaleString()}
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">DZD</span>
                      </p>
                      {deductionTotal === 0 && (
                        <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-0.5">
                          <TrendingUp className="h-3 w-3" />
                          Full salary
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* No balance warning for employees */}
      {!isAdmin && records.length === 0 && !isLoading && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">No payslips available yet</p>
              <p className="text-muted-foreground text-xs">Your HR administrator has not yet generated payroll for {filterYear}. Please contact them for more information.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payslip Detail Modal */}
      {selected && (
        <PayslipModal
          record={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
