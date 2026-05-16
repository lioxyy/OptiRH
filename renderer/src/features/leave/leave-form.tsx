import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

interface LeaveFormProps {
  onClose: () => void
}

export function LeaveForm({ onClose }: LeaveFormProps) {
  const queryClient = useQueryClient()
  const [typeId, setTypeId] = useState<number | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: types = [] } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const res = await api.get('/api/leave/types')
      return res.data.data
    }
  })

  // We can fetch the balance for the current year
  const { data: balances = [] } = useQuery({
    queryKey: ['leave-balances', new Date().getFullYear()],
    queryFn: async () => {
      const res = await api.get(`/api/leave/balance?year=${new Date().getFullYear()}`)
      return res.data.data
    }
  })

  const selectedBalance = typeId 
    ? balances.find((b: any) => b.id_type === Number(typeId)) 
    : null
    
  const remaining = selectedBalance ? selectedBalance.remaining : null
  const noBalanceRemaining = remaining !== null && remaining <= 0

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/leave', {
        id_type: Number(typeId),
        date_deb: new Date(startDate).toISOString(),
        date_fin: new Date(endDate).toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      onClose()
    }
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>New Leave Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Leave Type</label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : '')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a type...</option>
              {types.map((t: any) => (
                <option key={t.id_type} value={t.id_type}>{t.name}</option>
              ))}
            </select>
          </div>

          {remaining !== null && (
            <div className={`text-sm p-3 rounded-md ${noBalanceRemaining ? 'bg-destructive/10 text-destructive' : 'bg-secondary/50'}`}>
              Remaining balance: <strong>{remaining} days</strong>
              {noBalanceRemaining && (
                <div className="mt-1 font-medium">You do not have enough days remaining for this leave type.</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button 
              onClick={() => mutation.mutate()} 
              disabled={mutation.isPending || !typeId || !startDate || !endDate || noBalanceRemaining}
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
