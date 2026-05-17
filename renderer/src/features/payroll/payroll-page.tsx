import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'

import { PayrollForm } from './payroll-form'

interface Payslip {
  id_salaire: number
  month_year: string
  bonus_amount: number
  absence_deductions: number
  amount_final: number
  status: string
  id_emp: number
  employee?: { name: string; id_dept: number }
  contract?: { type: string; salaire_base: number }
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  Generated: 'secondary',
  Validated: 'default',
  Paid: 'outline',
}

export function PayrollPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: payslips = [], isLoading } = useQuery<Payslip[]>({
    queryKey: ['payroll'],
    queryFn: async () => {
      const res = await api.get('/api/payroll')
      return res.data.data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/api/payroll/${id}/status`, { status })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })



  const columns = React.useMemo<ColumnDef<Payslip>[]>(() => {
    const baseCols: ColumnDef<Payslip>[] = [
      ...((user?.role !== 'Employee' ? [{
        id: "employee",
        accessorFn: (row: Payslip) => row.employee?.name ?? '—',
        header: ({ column }: any) => <DataTableColumnHeader column={column} title="Employee" />,
      }] : []) as ColumnDef<Payslip>[]),
      {
        id: "period",
        accessorKey: "month_year",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
      },
      {
        id: "base_salary",
        accessorFn: (row) => row.contract?.salaire_base ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Base Salary" />,
        cell: ({ row }) => `${(row.original.contract?.salaire_base ?? 0).toLocaleString()} DA`,
      },
      {
        id: "bonus",
        accessorKey: "bonus_amount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Bonus" />,
        cell: ({ row }) => <span className="text-green-600">+{row.original.bonus_amount.toLocaleString()} DA</span>,
      },
      {
        id: "deductions",
        accessorKey: "absence_deductions",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deductions" />,
        cell: ({ row }) => <span className="text-destructive">-{row.original.absence_deductions.toLocaleString()} DA</span>,
      },
      {
        id: "net_amount",
        accessorKey: "amount_final",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Net Amount" />,
        cell: ({ row }) => <span className="font-bold">{row.original.amount_final.toLocaleString()} DA</span>,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <Badge variant={statusVariant[row.original.status] ?? 'outline'}>{row.original.status}</Badge>,
      }
    ]

    if (user?.role === 'Admin') {
      baseCols.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {row.original.status === 'Generated' && (
              <Button size="sm" onClick={() => updateStatus.mutate({ id: row.original.id_salaire, status: 'Validated' })}>
                Validate
              </Button>
            )}
            {row.original.status === 'Validated' && (
              <Button size="sm" onClick={() => updateStatus.mutate({ id: row.original.id_salaire, status: 'Paid' })}>
                Mark Paid
              </Button>
            )}
          </div>
        )
      })
    }
    return baseCols
  }, [user, updateStatus])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payroll</h1>
        {user?.role === 'Admin' && (
          <Button onClick={() => setShowForm(true)}>Generate Payslip</Button>
        )}
      </div>

      <GenericDataTable
        columns={columns}
        data={payslips}
        searchOptions={[
          ...(user?.role !== 'Employee' ? [{ id: "employee", label: "Employee Name" }] : []),
          { id: "period", label: "Period (MM/YYYY)" },
          { id: "status", label: "Status" }
        ]}
      />

      {showForm && <PayrollForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
