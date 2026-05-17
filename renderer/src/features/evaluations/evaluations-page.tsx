import * as React from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { EvaluationForm } from './evaluation-form'

interface Evaluation {
  id_eval: number
  score: number
  bonus_amount: number
  comments?: string | null
  type_eval: string
  date_eval: string
  evaluator?: { name: string }
  evaluatee_emp?: { name: string } | null
  evaluatee_cand?: { name: string } | null
}

export function EvaluationsPage() {
  const [showForm, setShowForm] = useState(false)

  const { data: evaluations = [], isLoading } = useQuery<Evaluation[]>({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const res = await api.get('/api/evaluations')
      return res.data.data
    },
  })



  const listColumns = React.useMemo<ColumnDef<Evaluation>[]>(() => [
    {
      id: "evaluatee",
      accessorFn: (row) => row.evaluatee_emp?.name || row.evaluatee_cand?.name || '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Evaluatee" />,
    },
    {
      id: "type",
      accessorKey: "type_eval",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => (
        <Badge variant={row.original.type_eval === 'Employee' ? 'default' : 'secondary'}>
          {row.original.type_eval}
        </Badge>
      )
    },
    {
      id: "score",
      accessorKey: "score",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
      cell: ({ row }) => (
        <span className={`font-medium ${row.original.score >= 70 ? 'text-green-600' : row.original.score >= 40 ? 'text-yellow-600' : 'text-destructive'}`}>
          {row.original.score}/100
        </span>
      )
    },
    {
      id: "bonus",
      accessorKey: "bonus_amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Bonus" />,
      cell: ({ row }) => row.original.bonus_amount > 0 ? `${row.original.bonus_amount} DA` : '—',
    },
    {
      id: "evaluator",
      accessorFn: (row) => row.evaluator?.name ?? '—',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Evaluator" />,
    },
    {
      id: "date",
      accessorKey: "date_eval",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => new Date(row.original.date_eval).toLocaleDateString(),
    }
  ], [])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Evaluations</h1>
        <Button onClick={() => setShowForm(true)}>New Evaluation</Button>
      </div>

      <GenericDataTable
        columns={listColumns}
        data={evaluations}
        searchKey="evaluatee"
        searchPlaceholder="Filter evaluations..."
      />

      {showForm && <EvaluationForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
