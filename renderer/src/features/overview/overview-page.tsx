import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  CheckSquare
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

function KpiCard({ title, value, description, icon: Icon, colorClass = "text-primary bg-primary/10" }: {
  title: string
  value: string | number
  description: string
  icon: any
  colorClass?: string
}) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-card rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function AdminDashboardView({ data }: { data: AdminData }) {
  const maxEmployeesInDept = Math.max(...data.departments_headcount.map(d => d._count.employees), 1)

  return (
    <div className="space-y-8">
      {/* 2x5 Grid for Admin metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Headcount"
          value={data.total_headcount}
          description="Total active personnel count"
          icon={Users}
          colorClass="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard
          title="Open Roles"
          value={data.open_positions}
          description="Candidates pending/in progress"
          icon={Briefcase}
          colorClass="text-blue-500 bg-blue-500/10"
        />
        <KpiCard
          title="Pending Leaves"
          value={data.pending_leaves}
          description="Leave requests pending approval"
          icon={CalendarCheck}
          colorClass="text-amber-500 bg-amber-500/10"
        />
        <KpiCard
          title="Payroll Cost"
          value={`${data.monthly_payroll_cost.toLocaleString()} DZD`}
          description="Current monthly calculation total"
          icon={Wallet}
          colorClass="text-indigo-500 bg-indigo-500/10"
        />
        <KpiCard
          title="Absence Rate"
          value={`${data.absence_rate_today}%`}
          description="Employee absence rate today"
          icon={Clock}
          colorClass="text-rose-500 bg-rose-500/10"
        />
        <KpiCard
          title="New Hires"
          value={data.new_hires_this_month}
          description="Onboarded during this month"
          icon={TrendingUp}
          colorClass="text-cyan-500 bg-cyan-500/10"
        />
        <KpiCard
          title="Expiring Contracts"
          value={data.expiring_contracts}
          description="Contracts ending within 30 days"
          icon={FileText}
          colorClass="text-amber-600 bg-amber-600/10"
        />
        <KpiCard
          title="Pending Payslips"
          value={data.pending_payslips}
          description="Payslips awaiting validation run"
          icon={CheckSquare}
          colorClass="text-purple-500 bg-purple-500/10"
        />
        <KpiCard
          title="Unread Alerts"
          value={data.unread_notifications}
          description="Unread notifications for me"
          icon={Bell}
          colorClass="text-red-500 bg-red-500/10"
        />
        <KpiCard
          title="Active Massrouf"
          value="Calculated"
          description="Standard salary advance flows"
          icon={PiggyBank}
          colorClass="text-teal-500 bg-teal-500/10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Stats */}
        <Card className="border-none shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Headcount by Department</CardTitle>
            <CardDescription className="text-xs">
              Distribution of employee assignments across departments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.departments_headcount.length === 0 ? (
              <p className="text-xs text-muted-foreground">No departments configured.</p>
            ) : (
              data.departments_headcount.map((dept) => {
                const count = dept._count.employees
                const percent = Math.round((count / maxEmployeesInDept) * 100)
                return (
                  <div key={dept.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{dept.name}</span>
                      <span className="text-muted-foreground">{count} {count === 1 ? 'employee' : 'employees'}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border-none shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Quick Administrative Tools</CardTitle>
            <CardDescription className="text-xs">
              Direct access links to key payroll and leave review modules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between h-10 rounded-lg text-xs" asChild>
              <Link to="/dashboard/payroll">
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Run & Validate Payroll Run
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between h-10 rounded-lg text-xs" asChild>
              <Link to="/dashboard/leaves">
                <span className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-emerald-500" />
                  Review Pending Leave Requests
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between h-10 rounded-lg text-xs" asChild>
              <Link to="/dashboard/contracts">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Manage Active Contracts
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AgentDashboardView({ data }: { data: AgentData }) {
  return (
    <div className="space-y-8">
      {/* 2x3 Grid for Agent metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Team Size"
          value={data.team_size}
          description="Active employees in assigned departments"
          icon={Users}
          colorClass="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard
          title="Pending Team Leaves"
          value={data.pending_leaves}
          description="Requests waiting manager approval"
          icon={CalendarCheck}
          colorClass="text-amber-500 bg-amber-500/10"
        />
        <KpiCard
          title="Team Overdue Tasks"
          value={data.overdue_tasks}
          description="Incomplete tasks past deadline"
          icon={AlertTriangle}
          colorClass="text-red-500 bg-red-500/10"
        />
        <KpiCard
          title="Scheduled Interviews"
          value={data.upcoming_interviews}
          description="Interviews scheduled this week"
          icon={Briefcase}
          colorClass="text-blue-500 bg-blue-500/10"
        />
        <KpiCard
          title="Active Tasks"
          value={data.in_progress_tasks}
          description="Tasks currently 'In Progress' by team"
          icon={ListTodo}
          colorClass="text-indigo-500 bg-indigo-500/10"
        />
        <KpiCard
          title="Team Absences Today"
          value={data.team_absences_today}
          description="Total active team absences today"
          icon={Clock}
          colorClass="text-rose-500 bg-rose-500/10"
        />
      </div>

      {/* Upcoming interviews list */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm rounded-xl md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">My Upcoming Interviews</CardTitle>
            <CardDescription className="text-xs">
              Candidates scheduled for your evaluation this week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.interviews_list.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No interviews scheduled this week.
              </div>
            ) : (
              <div className="space-y-4">
                {data.interviews_list.map((item) => (
                  <div key={item.id_entretien} className="flex items-center justify-between p-3 border bg-muted/20 rounded-lg">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-xs text-foreground block">{item.candidat.name}</span>
                      <span className="text-[10px] text-muted-foreground block font-mono">{item.candidat.email}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-foreground block">
                        {new Date(item.date_heure).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {new Date(item.date_heure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Operations */}
        <Card className="border-none shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Quick Links</CardTitle>
            <CardDescription className="text-xs">
              Actions for active recruitment and leaf approvals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between h-10 rounded-lg text-xs" asChild>
              <Link to="/dashboard/leaves">
                <span>Team Leave Panel</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between h-10 rounded-lg text-xs" asChild>
              <Link to="/dashboard/tasks">
                <span>Manage Team Tasks</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-between h-10 rounded-lg text-xs" asChild>
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
      {/* 2x3 Grid for Employee metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Active Tasks"
          value={data.active_tasks}
          description="Incomplete tasks assigned to me"
          icon={ListTodo}
          colorClass="text-blue-500 bg-blue-500/10"
        />
        <KpiCard
          title="Overdue Tasks"
          value={data.overdue_tasks}
          description="My tasks past the finish deadline"
          icon={AlertTriangle}
          colorClass="text-red-500 bg-red-500/10"
        />
        <KpiCard
          title="Last Payslip"
          value={data.last_payslip ? `${data.last_payslip.amount.toLocaleString()} DZD` : "—"}
          description={data.last_payslip ? `Salary paid for period: ${data.last_payslip.period}` : "No payslips issued yet"}
          icon={Wallet}
          colorClass="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard
          title="My Pending Leaves"
          value={data.pending_leaves}
          description="My requests awaiting validation"
          icon={CalendarCheck}
          colorClass="text-amber-500 bg-amber-500/10"
        />
        <KpiCard
          title="Upcoming Training"
          value={data.upcoming_formations}
          description="Scheduled formation participation"
          icon={GraduationCap}
          colorClass="text-indigo-500 bg-indigo-500/10"
        />
        <KpiCard
          title="Advance Request"
          value="Available"
          description="Massrouf salary advance portal"
          icon={PiggyBank}
          colorClass="text-teal-500 bg-teal-500/10"
        />
      </div>

      {/* Leave Balances Table */}
      <Card className="border-none shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">My Leave Balances</CardTitle>
          <CardDescription className="text-xs">
            Summary of allocated and consumed leave balances for this year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.leave_balances.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No leave balances allocated yet.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg bg-card text-foreground">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4 text-center">Allocated</th>
                    <th className="py-3 px-4 text-center">Carried Over</th>
                    <th className="py-3 px-4 text-center">Consumed</th>
                    <th className="py-3 px-4 text-center font-bold text-foreground">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
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
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
        <p className="text-xs text-muted-foreground">
          You are currently viewing the <strong className="text-primary font-semibold">{role} Workspace</strong> dashboard.
        </p>
      </div>

      {role === "Admin" && <AdminDashboardView data={data} />}
      {role === "Agent" && <AgentDashboardView data={data} />}
      {role !== "Admin" && role !== "Agent" && <EmployeeDashboardView data={data} />}
    </div>
  )
}
