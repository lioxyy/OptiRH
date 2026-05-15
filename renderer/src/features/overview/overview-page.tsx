import { useAuth } from '../../context/auth-context'
import { Card, CardContent } from '../../components/ui/card'
import {
  Users,
  Briefcase,
  DollarSign,
  Activity,
  UserCheck,
  CalendarClock,
  ListChecks,
  CalendarCheck,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface KpiCard {
  title: string
  value: string
  icon: LucideIcon
}

export function OverviewPage() {
  const { user } = useAuth()

  let kpiCards: KpiCard[] = []

  if (user?.role === 'Admin') {
    kpiCards = [
      { title: 'Total Employees', value: '—', icon: Users },
      { title: 'Open Positions', value: '—', icon: Briefcase },
      { title: 'Monthly Payroll', value: '—', icon: DollarSign },
      { title: 'Leave Rate', value: '—', icon: Activity },
    ]
  } else if (user?.role === 'Agent') {
    kpiCards = [
      { title: 'Team Size', value: '—', icon: UserCheck },
      { title: 'Pending Leaves', value: '—', icon: CalendarClock },
      { title: 'Active Tasks', value: '—', icon: ListChecks },
      { title: 'Upcoming Interviews', value: '—', icon: CalendarCheck },
    ]
  } else {
    kpiCards = [
      { title: 'Current Contract', value: '—', icon: FileText },
      { title: 'Leave Balance', value: '—', icon: CalendarClock },
      { title: 'Assigned Tasks', value: '—', icon: ListChecks },
    ]
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
