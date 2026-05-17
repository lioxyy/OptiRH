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
import { ContractForm } from './contract-form'

interface Contract {
  id_contract: number
  id_emp: number
  type: string
  date_deb: string
  date_fin?: string | null
  salaire_base: number
  status: string
  employee?: { name: string, id_dept: number }
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Active: 'default',
  Terminated: 'destructive',
}

export function ContractsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const res = await api.get('/api/contracts')
      return res.data.data
    },
  })

  const terminateMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/contracts/${id}/terminate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    }
  })

  if (isLoading) return <div className="p-6">Loading...</div>

  const isExpiring = (dateFin?: string | null) => {
    if (!dateFin) return false
    const fin = new Date(dateFin)
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    return fin <= thirtyDays && fin >= new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contracts</h1>
        {user?.role === 'Admin' && (
          <Button onClick={() => setShowForm(true)}>Add Contract</Button>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {user?.role !== 'Employee' && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                {user?.role === 'Admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => {
                const expiring = contract.status === 'Active' && isExpiring(contract.date_fin)
                return (
                  <TableRow key={contract.id_contract} className={expiring ? 'bg-destructive/5 border-l-4 border-l-destructive' : ''}>
                    {user?.role !== 'Employee' && (
                      <TableCell className="font-medium">{contract.employee?.name}</TableCell>
                    )}
                    <TableCell>{contract.type}</TableCell>
                    <TableCell>{new Date(contract.date_deb).toLocaleDateString()}</TableCell>
                    <TableCell>{contract.date_fin ? new Date(contract.date_fin).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{contract.salaire_base.toLocaleString()} DA</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[contract.status] ?? 'outline'}>{contract.status}</Badge>
                        {expiring && <Badge variant="destructive">Expiring Soon</Badge>}
                      </div>
                    </TableCell>
                    {user?.role === 'Admin' && (
                      <TableCell className="text-right">
                        {contract.status === 'Active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to terminate this contract?')) {
                                terminateMutation.mutate(contract.id_contract)
                              }
                            }}
                          >
                            Terminate
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={user?.role === 'Employee' ? 5 : 7} className="text-center py-6 text-muted-foreground">
                    No contracts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && <ContractForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
