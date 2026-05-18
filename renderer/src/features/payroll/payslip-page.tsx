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

import { PayslipModal, PayrollRecord } from './shared/payslip-modal'

const STATUS_CONFIG = {
  Generated: { label: 'Generated', className: 'text-blue-500 border-blue-500/30' },
  Validated: { label: 'Validated', className: 'text-amber-500 border-amber-500/30' },
  Paid: { label: 'Paid', className: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' },
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

  const totalNet = records.reduce((s, r) => s + r.amount_final, 0)
  const totalDeduct = records.reduce((s, r) => s + r.absence_deductions, 0)
  const paidCount = records.filter(r => r.status === 'Paid').length
  const avgSalary = records.length > 0 ? Math.round(totalNet / records.length) : 0

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
      accessorFn: (row) => row.absence_deductions + Math.max(0, (row.contract?.salaire_base ?? 0) + row.bonus_amount - row.absence_deductions - row.amount_final),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Deductions" />,
      cell: ({ row }) => {
        const totalDeductions = row.original.absence_deductions + Math.max(0, (row.original.contract?.salaire_base ?? 0) + row.original.bonus_amount - row.original.absence_deductions - row.original.amount_final)
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
