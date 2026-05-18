import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
  Users,
  FileText,
  CalendarCheck,
  Wallet,
  Bell,
  AlertTriangle,
  ListTodo,
  Briefcase,
  GraduationCap,
  Clock,
  ArrowRight,
  TrendingUp,
  PiggyBank,
  CheckSquare,
  Info,
  Calendar
} from "lucide-react"

// --- Component Types ---

interface AdminData {
  total_headcount: number
  departments_headcount: Array<{ name: string; _count: { employees: number } }>
  open_positions: number
  expiring_contracts: number
  pending_leaves: number
  monthly_payroll_cost: number
  absence_rate_today: number
  new_hires_this_month: number
  pending_payslips: number
  unread_notifications: number
}

interface AgentData {
  team_size: number
  pending_leaves: number
  overdue_tasks: number
  upcoming_interviews: number
  interviews_list: Array<{
    id_entretien: number
    date_heure: string
    status: string
    candidat: { name: string; email: string }
  }>
  in_progress_tasks: number
  team_absences_today: number
}

interface EmployeeData {
  leave_balances: Array<{
    id_balance: number
    allocated: number
    carried_over: number
    consumed: number
    leave_type: { name: string }
  }>
  active_tasks: number
  overdue_tasks: number
  last_payslip: { amount: number; period: string } | null
  upcoming_formations: number
  pending_leaves: number
}

// --- Subviews ---

function KpiCard({ title, value, trend, description, icon: Icon, colorClass = "text-primary bg-primary/10", trendUp = true }: {
  title: string
  value: string | number
  trend?: string
  description: string
  icon: any
  colorClass?: string
  trendUp?: boolean
}) {
  return (
    <Card className="border border-border bg-card/60 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-1px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-extrabold tracking-tight text-foreground">{value}</div>
          {trend && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
              trendUp 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "bg-rose-500/10 text-rose-500"
            }`}>
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function AdminDashboardView({ data }: { data: AdminData }) {
  const maxEmployeesInDept = Math.max(...data.departments_headcount.map(d => d._count.employees), 1)

  return (
    <div className="space-y-8">
      {/* 2x5 Grid for Admin metrics styled like arhamkhnz dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Headcount"
          value={data.total_headcount}
          trend="+2.8%"
          description="Total active personnel count"
          icon={Users}
          colorClass="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard
          title="Open Roles"
          value={data.open_positions}
          trend="81 active"
          description="Candidates pending / in progress"
          icon={Briefcase}
          colorClass="text-blue-500 bg-blue-500/10"
        />
        <KpiCard
          title="Pending Leaves"
          value={data.pending_leaves}
          trend="Review req."
          description="Leave requests pending approval"
          icon={CalendarCheck}
          colorClass="text-amber-500 bg-amber-500/10"
        />
        <KpiCard
          title="Payroll Cost"
          value={`${data.monthly_payroll_cost.toLocaleString()} DZD`}
          trend="+1.2%"
          description="Current monthly calculation"
          icon={Wallet}
          colorClass="text-indigo-500 bg-indigo-500/10"
        />
        <KpiCard
          title="Absence Rate"
          value={`${data.absence_rate_today}%`}
          trend="Daily stats"
          description="Employee absence rate today"
          icon={Clock}
          colorClass="text-rose-500 bg-rose-500/10"
          trendUp={false}
        />
        <KpiCard
          title="New Hires"
          value={data.new_hires_this_month}
          trend="This month"
          description="Onboarded during current period"
          icon={TrendingUp}
          colorClass="text-cyan-500 bg-cyan-500/10"
        />
        <KpiCard
          title="Expiring Contracts"
          value={data.expiring_contracts}
          trend="Action req."
          description="Contracts ending within 30 days"
          icon={FileText}
          colorClass="text-amber-600 bg-amber-600/10"
          trendUp={false}
        />
        <KpiCard
          title="Pending Payslips"
          value={data.pending_payslips}
          trend="Generated"
          description="Payslips awaiting validation run"
          icon={CheckSquare}
          colorClass="text-purple-500 bg-purple-500/10"
        />
        <KpiCard
          title="Unread Alerts"
          value={data.unread_notifications}
          trend="Notifications"
          description="Unread alerts in my inbox"
          icon={Bell}
          colorClass="text-red-500 bg-red-500/10"
          trendUp={false}
        />
        <KpiCard
          title="Active Massrouf"
          value="Calculated"
          trend="Salary advances"
          description="Approved salary advance metrics"
          icon={PiggyBank}
          colorClass="text-teal-500 bg-teal-500/10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Department Stats styled like the Gantt Performance Highlights */}
        <Card className="border border-border bg-card/40 rounded-xl shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                Department Performance Highlights
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </CardTitle>
              <CardDescription className="text-xs">
                Active department employee distribution and workload stats.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground hover:underline cursor-pointer">View Insights →</span>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {data.departments_headcount.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No active departments configured.</p>
            ) : (
              data.departments_headcount.map((dept) => {
                const count = dept._count.employees
                const percent = Math.round((count / maxEmployeesInDept) * 100)
                const initials = dept.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={dept.name} className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-muted-foreground w-12 block">{initials}</span>
                    <div className="flex-1 relative flex items-center">
                      <div className="w-full bg-muted/60 rounded-full h-8 flex items-center px-3 overflow-hidden border border-border/30">
                        <div
                          className="bg-primary/10 border-r-2 border-primary absolute left-0 top-0 bottom-0 rounded-l transition-all duration-300 flex items-center pl-3"
                          style={{ width: `${percent}%` }}
                        >
                          <span className="text-[10px] font-bold text-primary truncate">
                            {dept.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-foreground w-8 text-right">{count}</span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Operations Agenda List (styled like Class Schedule) */}
        <Card className="border border-border bg-card/40 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Today's Operation Log</CardTitle>
            <CardDescription className="text-xs">
              Direct access tools and quick audit links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3 items-start border-l-2 border-emerald-500 pl-3 py-1">
                <div className="text-[10px] text-muted-foreground font-mono w-16">
                  09:00 - 10:30
                  <span className="block text-[8px] text-muted-foreground/60">May 18</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">Payroll Check</span>
                  <span className="text-[10px] text-muted-foreground block">Run current salaries run</span>
                </div>
                <Badge variant="outline" className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-0 px-1.5">
                  Live
                </Badge>
              </div>

              <div className="flex gap-3 items-start border-l-2 border-amber-500 pl-3 py-1">
                <div className="text-[10px] text-muted-foreground font-mono w-16">
                  11:00 - 12:00
                  <span className="block text-[8px] text-muted-foreground/60">May 18</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">Leaves Panel</span>
                  <span className="text-[10px] text-muted-foreground block">Pending leaves validation</span>
                </div>
                <Badge variant="outline" className="ml-auto text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20 py-0 px-1.5">
                  Action
                </Badge>
              </div>

              <div className="flex gap-3 items-start border-l-2 border-indigo-500 pl-3 py-1">
                <div className="text-[10px] text-muted-foreground font-mono w-16">
                  14:30 - 15:30
                  <span className="block text-[8px] text-muted-foreground/60">May 18</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">Contracts Roll</span>
                  <span className="text-[10px] text-muted-foreground block">Verify contract deadlines</span>
                </div>
                <Badge variant="outline" className="ml-auto text-[9px] bg-indigo-500/10 text-indigo-500 border-indigo-500/20 py-0 px-1.5">
                  Review
                </Badge>
              </div>
            </div>

            <hr className="border-border/60" />

            <div className="space-y-2.5">
              <Button variant="outline" className="w-full justify-between h-9 rounded-lg text-xs" asChild>
                <Link to="/dashboard/payroll">
                  <span>Open Payroll Service</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between h-9 rounded-lg text-xs" asChild>
                <Link to="/dashboard/leaves">
                  <span>Open Leave Requests</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AgentDashboardView({ data }: { data: AgentData }) {
  return (
    <div className="space-y-8">
      {/* 2x3 Grid for Agent metrics styled like arhamkhnz dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Team Size"
          value={data.team_size}
          trend="+1.8%"
          description="Active employees in assigned departments"
          icon={Users}
          colorClass="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard
          title="Pending Team Leaves"
          value={data.pending_leaves}
          trend="Review req."
          description="Requests waiting manager approval"
          icon={CalendarCheck}
          colorClass="text-amber-500 bg-amber-500/10"
        />
        <KpiCard
          title="Team Overdue Tasks"
          value={data.overdue_tasks}
          trend="Needs attention"
          description="Incomplete tasks past deadline"
          icon={AlertTriangle}
          colorClass="text-red-500 bg-red-500/10"
          trendUp={false}
        />
        <KpiCard
          title="Scheduled Interviews"
          value={data.upcoming_interviews}
          trend="This week"
          description="Interviews scheduled this week"
          icon={Briefcase}
          colorClass="text-blue-500 bg-blue-500/10"
        />
        <KpiCard
          title="Active Tasks"
          value={data.in_progress_tasks}
          trend="In Progress"
          description="Tasks currently in progress by team"
          icon={ListTodo}
          colorClass="text-indigo-500 bg-indigo-500/10"
        />
        <KpiCard
          title="Team Absences Today"
          value={data.team_absences_today}
          trend="Daily rate"
          description="Total active team absences today"
          icon={Clock}
          colorClass="text-rose-500 bg-rose-500/10"
          trendUp={false}
        />
      </div>

      {/* Upcoming events / interviews layout block exactly matching Image 2 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-border bg-card/40 rounded-xl shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                Upcoming Events & Interviews
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription className="text-xs">
                Candidate interviews assigned for your evaluation.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground hover:underline cursor-pointer">View Calendar →</span>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.interviews_list.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No upcoming events or interviews scheduled.
              </div>
            ) : (
              data.interviews_list.map((item) => {
                const dateObj = new Date(item.date_heure)
                const day = dateObj.getDate()
                const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
                return (
                  <div key={item.id_entretien} className="flex items-center gap-4 p-2.5 border border-border/60 bg-muted/10 rounded-lg">
                    {/* Calendar Event Block matching mockup */}
                    <div className="flex flex-col items-center justify-center h-12 w-12 bg-neutral-900 border rounded-lg overflow-hidden shrink-0">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">{month}</span>
                      <span className="text-lg font-extrabold text-foreground leading-none">{day}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs text-foreground block truncate">{item.candidat.name}</span>
                      <span className="text-[10px] text-muted-foreground block truncate font-mono mt-0.5">
                        {new Date(item.date_heure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {item.candidat.email}
                      </span>
                    </div>

                    <Badge variant="outline" className="text-[9px] bg-neutral-800 text-muted-foreground py-0.5 px-2 rounded-full shrink-0 border-border/80">
                      Scheduled
                    </Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className="border border-border bg-card/40 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Quick Operations</CardTitle>
            <CardDescription className="text-xs">
              Actions for active recruitment and leaf approvals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between h-9 rounded-lg text-xs" asChild>
              <Link to="/dashboard/leaves">
                <span>Team Leave Panel</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between h-9 rounded-lg text-xs" asChild>
              <Link to="/dashboard/tasks">
                <span>Manage Team Tasks</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between h-9 rounded-lg text-xs" asChild>
              <Link to="/dashboard/recruitment">
                <span>Recruitment Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmployeeDashboardView({ data }: { data: EmployeeData }) {
  return (
    <div className="space-y-8">
      {/* 2x3 Grid for Employee metrics styled like arhamkhnz dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Active Tasks"
          value={data.active_tasks}
          trend={`${data.active_tasks} assigned`}
          description="Incomplete tasks assigned to me"
          icon={ListTodo}
          colorClass="text-blue-500 bg-blue-500/10"
        />
        <KpiCard
          title="Overdue Tasks"
          value={data.overdue_tasks}
          trend="Needs action"
          description="My tasks past the finish deadline"
          icon={AlertTriangle}
          colorClass="text-red-500 bg-red-500/10"
          trendUp={false}
        />
        <KpiCard
          title="Last Payslip"
          value={data.last_payslip ? `${data.last_payslip.amount.toLocaleString()} DZD` : "—"}
          trend={data.last_payslip ? data.last_payslip.period : "None"}
          description={data.last_payslip ? `Salary paid for period: ${data.last_payslip.period}` : "No payslips issued yet"}
          icon={Wallet}
          colorClass="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard
          title="My Pending Leaves"
          value={data.pending_leaves}
          trend="Awaiting"
          description="My requests awaiting validation"
          icon={CalendarCheck}
          colorClass="text-amber-500 bg-amber-500/10"
        />
        <KpiCard
          title="Upcoming Training"
          value={data.upcoming_formations}
          trend="Formations"
          description="Scheduled formation participation"
          icon={GraduationCap}
          colorClass="text-indigo-500 bg-indigo-500/10"
        />
        <KpiCard
          title="Advance Request"
          value="Available"
          trend="Massrouf"
          description="Salary advance active portal"
          icon={PiggyBank}
          colorClass="text-teal-500 bg-teal-500/10"
        />
      </div>

      {/* Class Schedule-style list for Employee Agenda & Leave Balances */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Leave Balances Cards */}
        <Card className="border border-border bg-card/40 rounded-xl shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">My Leave Balances</CardTitle>
            <CardDescription className="text-xs">
              Breakdown of allocated, carried over, and consumed leave balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.leave_balances.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No leave balances allocated yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border/60 rounded-lg bg-card text-foreground">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4 text-center">Allocated</th>
                      <th className="py-3 px-4 text-center">Carried Over</th>
                      <th className="py-3 px-4 text-center">Consumed</th>
                      <th className="py-3 px-4 text-center font-bold text-foreground">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.leave_balances.map((bal) => {
                      const remaining = bal.allocated + bal.carried_over - bal.consumed
                      return (
                        <tr key={bal.id_balance} className="hover:bg-muted/20">
                          <td className="py-3 px-4 font-semibold text-foreground">{bal.leave_type.name}</td>
                          <td className="py-3 px-4 text-center font-mono">{bal.allocated} days</td>
                          <td className="py-3 px-4 text-center font-mono">{bal.carried_over} days</td>
                          <td className="py-3 px-4 text-center font-mono text-muted-foreground">{bal.consumed} days</td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-emerald-600">{remaining} days</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule panel exactly matching mockup Class Schedule in Image 3 */}
        <Card className="border border-border bg-card/40 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold">My Personal Agenda</CardTitle>
              <CardDescription className="text-xs">
                Active tasks and scheduled priorities.
              </CardDescription>
            </div>
            <span className="text-[10px] text-muted-foreground hover:underline cursor-pointer">Full Schedule →</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3.5">
              <div className="flex gap-3 items-start border-l-2 border-emerald-500 pl-3 py-1">
                <div className="text-[10px] text-muted-foreground font-mono w-16 shrink-0">
                  09:00 - 18:00
                  <span className="block text-[8px] text-muted-foreground/60">Mon, 18 May</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">Review Task List</span>
                  <span className="text-[10px] text-muted-foreground block truncate">Primary workload duties</span>
                </div>
                <Badge variant="outline" className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-0 px-1.5 shrink-0">
                  In Progress
                </Badge>
              </div>

              <div className="flex gap-3 items-start border-l-2 border-amber-500 pl-3 py-1">
                <div className="text-[10px] text-muted-foreground font-mono w-16 shrink-0">
                  10:00 - 11:00
                  <span className="block text-[8px] text-muted-foreground/60">Mon, 18 May</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">Payroll Check</span>
                  <span className="text-[10px] text-muted-foreground block truncate">Awaiting validated run</span>
                </div>
                <Badge variant="outline" className="ml-auto text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20 py-0 px-1.5 shrink-0">
                  Upcoming
                </Badge>
              </div>

              <div className="flex gap-3 items-start border-l-2 border-indigo-500 pl-3 py-1">
                <div className="text-[10px] text-muted-foreground font-mono w-16 shrink-0">
                  14:30 - 15:30
                  <span className="block text-[8px] text-muted-foreground/60">Mon, 18 May</span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">Team Alignment</span>
                  <span className="text-[10px] text-muted-foreground block truncate">Assigned structural training</span>
                </div>
                <Badge variant="outline" className="ml-auto text-[9px] bg-indigo-500/10 text-indigo-500 border-indigo-500/20 py-0 px-1.5 shrink-0">
                  Upcoming
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// --- Main Layout ---

export function OverviewPage() {
  const { user } = useAuth()
  const role = user?.role ?? "Employee"

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["dashboardData", role],
    queryFn: async () => {
      let endpoint = "/api/analytics/dashboard/employee"
      if (role === "Admin") {
        endpoint = "/api/analytics/dashboard/admin"
      } else if (role === "Agent") {
        endpoint = "/api/analytics/dashboard/agent"
      }
      const res = await api.get(endpoint)
      return res.data.data
    }
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
        <span className="font-semibold text-sm text-foreground">Failed to load dashboard statistics</span>
        <span className="text-xs text-muted-foreground mt-1">Please make sure the OptiRH service is running normally.</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Good morning, <span className="font-semibold text-foreground">{user?.name}</span>. Here's a quick overview of today's activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs font-semibold rounded-lg">
            New Announcement
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs font-semibold rounded-lg">
            View Analytics
          </Button>
        </div>
      </div>

      {role === "Admin" && <AdminDashboardView data={data} />}
      {role === "Agent" && <AgentDashboardView data={data} />}
      {role !== "Admin" && role !== "Agent" && <EmployeeDashboardView data={data} />}
    </div>
  )
}
