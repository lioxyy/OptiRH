import * as React from 'react'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../context/auth-context'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
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

  const columns = React.useMemo<ColumnDef<Contract>[]>(() => {
    const baseCols: ColumnDef<Contract>[] = [
      ...((user?.role !== 'Employee' ? [{
        id: "employee",
        accessorFn: (row: Contract) => row.employee?.name ?? '—',
        header: ({ column }: any) => <DataTableColumnHeader column={column} title="Employee" />,
      }] : []) as ColumnDef<Contract>[]),
      {
        id: "type",
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      },
      {
        id: "start_date",
        accessorKey: "date_deb",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
        cell: ({ row }) => new Date(row.original.date_deb).toLocaleDateString(),
      },
      {
        id: "end_date",
        accessorFn: (row) => row.date_fin ? new Date(row.date_fin).toLocaleDateString() : '—',
        header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
      },
      {
        id: "salary",
        accessorKey: "salaire_base",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Salary" />,
        cell: ({ row }) => `${row.original.salaire_base.toLocaleString()} DA`,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const expiring = row.original.status === 'Active' && isExpiring(row.original.date_fin)
          return (
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[row.original.status] ?? 'outline'}>{row.original.status}</Badge>
              {expiring && <Badge variant="destructive">Expiring Soon</Badge>}
            </div>
          )
        }
      }
    ]

    if (user?.role === 'Admin') {
      baseCols.push({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {row.original.status === 'Active' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to terminate this contract?')) {
                    terminateMutation.mutate(row.original.id_contract)
                  }
                }}
              >
                Terminate
              </Button>
            )}
          </div>
        )
      })
    }
    return baseCols
  }, [user, terminateMutation])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contracts</h1>
        {user?.role === 'Admin' && (
          <Button onClick={() => setShowForm(true)}>Add Contract</Button>
        )}
      </div>

      <GenericDataTable
        columns={columns}
        data={contracts}
        searchKey="type"
        searchPlaceholder="Filter contracts by type..."
      />

      {showForm && <ContractForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
