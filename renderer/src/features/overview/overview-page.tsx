import { useAuth } from '../../context/auth-context'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
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
  TrendingUp,
} from 'lucide-react'

interface KpiCard {
  title: string
  value: string
  icon: typeof TrendingUp
  trend?: string
  trendUp?: boolean
  footer: string
}

export function OverviewPage() {
  const { user } = useAuth()

  let cards: KpiCard[] = []

  if (user?.role === 'Admin') {
    cards = [
      { title: 'Total Employees', value: '—', icon: Users, trend: '+0%', trendUp: true, footer: 'Active workforce' },
      { title: 'Open Positions', value: '—', icon: Briefcase, trend: '—', footer: 'Pending requisitions' },
      { title: 'Monthly Payroll', value: '—', icon: DollarSign, trend: '—', footer: 'Current month' },
      { title: 'Leave Rate', value: '—', icon: Activity, trend: '—', footer: 'Last 30 days' },
    ]
  } else if (user?.role === 'Agent') {
    cards = [
      { title: 'Team Size', value: '—', icon: UserCheck, trend: '—', footer: 'Department headcount' },
      { title: 'Pending Leaves', value: '—', icon: CalendarClock, trend: '—', footer: 'Awaiting approval' },
      { title: 'Active Tasks', value: '—', icon: ListChecks, trend: '—', footer: 'In progress' },
      { title: 'Upcoming Interviews', value: '—', icon: CalendarCheck, trend: '—', footer: 'Scheduled' },
    ]
  } else {
    cards = [
      { title: 'Current Contract', value: '—', icon: FileText, trend: '—', footer: 'Active' },
      { title: 'Leave Balance', value: '—', icon: CalendarClock, trend: '—', footer: 'Remaining days' },
      { title: 'Assigned Tasks', value: '—', icon: ListChecks, trend: '—', footer: 'My tasks' },
    ]
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="shadow-xs bg-gradient-to-t from-primary/5 to-card dark:bg-card">
            <CardHeader className="relative">
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {card.value}
              </CardTitle>
              <div className="absolute right-4 top-4 rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.trend && card.trend !== '—' && (
                  <TrendingUp className={`size-4 ${card.trendUp ? '' : 'text-destructive'}`} />
                )}
                {card.trend}
              </div>
              <div className="text-muted-foreground">{card.footer}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
