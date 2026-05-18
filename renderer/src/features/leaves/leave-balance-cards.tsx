import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'

interface Balance {
  id_balance: number
  id_type: number
  year: number
  allocated: number
  consumed: number
  carried_over: number
  leave_type: { name: string }
}

function BalanceBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  const color = pct >= 80 ? 'bg-destructive' : pct >= 50 ? 'bg-yellow-500' : 'bg-primary'
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function LeaveBalanceCards() {
  const year = new Date().getFullYear()

  const { data: balances = [], isLoading } = useQuery<Balance[]>({
    queryKey: ['leaves', 'balances', year],
    queryFn: async () => {
      const res = await api.get(`/api/leaves/balances/${year}`)
      return res.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No leave balance for the year {year}.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {balances.map((b) => {
        const total = b.allocated + b.carried_over
        const remaining = total - b.consumed
        return (
          <Card key={b.id_balance}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{b.leave_type.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{year}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Allocated</dt>
                  <dd className="font-medium">{b.allocated} d</dd>
                </div>
                {b.carried_over > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Carried over</dt>
                    <dd className="font-medium">+{b.carried_over} d</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Consumed</dt>
                  <dd className="font-medium text-destructive">{b.consumed} d</dd>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <dt className="font-semibold">Remaining</dt>
                  <dd className={`font-bold ${remaining <= 0 ? 'text-destructive' : 'text-primary'}`}>
                    {remaining} d
                  </dd>
                </div>
              </dl>
              <BalanceBar value={b.consumed} max={total} />
              <p className="text-xs text-muted-foreground text-right">
                {b.consumed}/{total} days used
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
