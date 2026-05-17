import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table'
import { Card, CardContent } from '../../components/ui/card'
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

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payroll</h1>
        {user?.role === 'Admin' && (
          <Button onClick={() => setShowForm(true)}>Generate Payslip</Button>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role !== 'Employee' && <TableHead>Employee</TableHead>}
                <TableHead>Period</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Status</TableHead>
                {user?.role === 'Admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((slip) => (
                <TableRow key={slip.id_salaire}>
                  {user?.role !== 'Employee' && (
                    <TableCell className="font-medium">{slip.employee?.name}</TableCell>
                  )}
                  <TableCell>{slip.month_year}</TableCell>
                  <TableCell>{slip.contract?.salaire_base?.toLocaleString() ?? '—'} DA</TableCell>
                  <TableCell className="text-green-600">+{slip.bonus_amount.toLocaleString()} DA</TableCell>
                  <TableCell className="text-destructive">-{slip.absence_deductions.toLocaleString()} DA</TableCell>
                  <TableCell className="font-bold">{slip.amount_final.toLocaleString()} DA</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[slip.status] ?? 'outline'}>{slip.status}</Badge>
                  </TableCell>
                  {user?.role === 'Admin' && (
                    <TableCell className="text-right space-x-1">
                      {slip.status === 'Generated' && (
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: slip.id_salaire, status: 'Validated' })}>
                          Validate
                        </Button>
                      )}
                      {slip.status === 'Validated' && (
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: slip.id_salaire, status: 'Paid' })}>
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {payslips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={user?.role === 'Employee' ? 6 : 9} className="text-center py-6 text-muted-foreground">
                    No payslips found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && <PayrollForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
