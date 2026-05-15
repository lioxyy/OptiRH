import { useAuth } from '../../context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export function OverviewPage() {
  const { user } = useAuth()

  const kpiCards = []

  if (user?.role === 'Admin') {
    kpiCards.push(
      { title: 'Total Employees', value: '—' },
      { title: 'Open Positions', value: '—' },
      { title: 'Monthly Payroll', value: '—' },
      { title: 'Leave Rate', value: '—' },
    )
  } else if (user?.role === 'Agent') {
    kpiCards.push(
      { title: 'Team Size', value: '—' },
      { title: 'Pending Leaves', value: '—' },
      { title: 'Active Tasks', value: '—' },
      { title: 'Upcoming Interviews', value: '—' },
    )
  } else {
    kpiCards.push(
      { title: 'Current Contract', value: '—' },
      { title: 'Leave Balance', value: '—' },
      { title: 'Assigned Tasks', value: '—' },
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
