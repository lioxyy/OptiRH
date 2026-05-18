import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  CalendarDays,
  FileText,
  Wallet,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  GraduationCap,
  History,
  AlertTriangle
} from "lucide-react"
import { format } from "date-fns"

// --- Minimalist KPI Card ---
function OperationalKpi({ title, value, icon: Icon, description }: {
  title: string
  value: string | number
  icon: any
  description: string
}) {
  return (
    <Card className="border shadow-none bg-background py-0">
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground/50" />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
      </CardContent>
    </Card>
  )
}

export function OverviewPage() {
  const queryClient = useQueryClient()

  // Fetch unified operational data
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["unifiedDashboard"],
    queryFn: async () => {
      const res = await api.get("/api/analytics/dashboard/unified")
      return res.data.data
    }
  })

  // Leave approval mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "Approved" | "Rejected" }) => {
      return api.post(`/api/leaves/${id}/validate`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unifiedDashboard"] })
      toast.success("Leave request updated successfully")
    },
    onError: () => toast.error("Failed to update leave request")
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted/20" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-96 animate-pulse bg-muted/20" />
          <Card className="h-96 animate-pulse bg-muted/20" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center p-4">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
        <span className="font-semibold text-sm">Failed to load operational dashboard</span>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const { kpis, tables } = data

  return (
    <div className="space-y-6 pb-8">
      {/* Header section with minimal greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">Operations Command</h1>
        <p className="text-xs text-muted-foreground">System overview for {format(new Date(), "eeee, MMMM do, yyyy")}</p>
      </div>

      {/* 4 Minimal KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OperationalKpi
          title="Interviews"
          value={kpis.scheduledInterviews}
          icon={CalendarDays}
          description="Scheduled for today & tomorrow"
        />
        <OperationalKpi
          title="Contracts"
          value={kpis.expiringContracts}
          icon={FileText}
          description="Expiring within 30 days"
        />
        <OperationalKpi
          title="Pending Paie"
          value={kpis.pendingPayslips}
          icon={Wallet}
          description="Awaiting validation run"
        />
        <OperationalKpi
          title="Attendance"
          value={kpis.presentPersonnel}
          icon={Users}
          description="Personnel present today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leaves Table */}
        <Card className="border shadow-none">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Pending Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tables.pendingLeaves.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-4 text-center border rounded-lg border-dashed">No pending leave requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b text-muted-foreground font-semibold">
                      <th className="py-2 px-1">Employee</th>
                      <th className="py-2 px-1">Period</th>
                      <th className="py-2 px-1">Type</th>
                      <th className="py-2 px-1 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tables.pendingLeaves.map((l: any) => (
                      <tr key={l.id_conge} className="hover:bg-muted/30">
                        <td className="py-3 px-1">
                          <div className="font-semibold">{l.employee.name}</div>
                          <div className="opacity-60 text-[9px]">{l.employee.role}</div>
                        </td>
                        <td className="py-3 px-1 font-mono">
                          {format(new Date(l.date_deb), "MMM dd")} - {format(new Date(l.date_fin), "MMM dd")}
                        </td>
                        <td className="py-3 px-1">
                          <Badge variant="outline" className="text-[9px] font-normal px-2 py-0">{l.leave_type.name}</Badge>
                        </td>
                        <td className="py-3 px-1 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                              onClick={() => approveMutation.mutate({ id: l.id_conge, status: "Approved" })}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => approveMutation.mutate({ id: l.id_conge, status: "Rejected" })}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Activity (Logs) */}
        <Card className="border shadow-none">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Today's System Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tables.todaysLogs.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-4 text-center border rounded-lg border-dashed">No activity recorded today.</p>
            ) : (
              <div className="space-y-3">
                {tables.todaysLogs.map((log: any) => (
                  <div key={log.id_log} className="flex gap-3 items-start border-b pb-2 last:border-0">
                    <span className="text-[9px] font-mono text-muted-foreground w-12 shrink-0">{format(new Date(log.timestamp), "HH:mm")}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold block truncate">
                        {log.actor?.name || "System"} <span className="font-normal opacity-70">performed</span> {log.action}
                      </span>
                      <span className="text-[9px] text-muted-foreground block truncate italic uppercase">
                        {log.target_model} (ID: {log.target_id})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formations & Learning */}
        <Card className="border shadow-none">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Today's Formations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tables.todaysFormations.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-4 text-center border rounded-lg border-dashed">No formations scheduled for today.</p>
            ) : (
              <div className="grid gap-3">
                {tables.todaysFormations.map((f: any) => (
                  <div key={f.id_formation} className="p-3 bg-muted/10 border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold block truncate">{f.name}</span>
                        <span className="text-[9px] text-muted-foreground block">{f.location || "On-site"} • {f.duration_days} days</span>
                      </div>
                      <Badge variant="outline" className="text-[8px] h-4 font-normal">Active</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 pt-2 border-t border-muted-foreground/10">
                      <div className="h-4 w-4 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <Users className="h-2.5 w-2.5 text-indigo-500" />
                      </div>
                      <span className="text-[9px] font-medium tracking-tight">Instructor: {f.instructor?.name || f.external_instructor || "External"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Operational Tasks */}
        <Card className="border shadow-none">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              My Operational Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tables.myTasks.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-4 text-center border rounded-lg border-dashed">No pending tasks assigned to you.</p>
            ) : (
              <div className="space-y-2">
                {tables.myTasks.map((t: any) => (
                  <div key={t.id_task} className="flex items-center gap-3 p-2.5 hover:bg-muted/10 rounded-lg group transition-all">
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.priority === "High" ? "bg-rose-500 animate-pulse" : t.priority === "Medium" ? "bg-amber-500" : "bg-blue-500"
                      }`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold block truncate group-hover:text-primary transition-colors">{t.name}</span>
                      <span className="text-[9px] text-muted-foreground block truncate">Deadline: {format(new Date(t.date_fin), "MMM dd, yyyy")}</span>
                    </div>
                    <Badge variant="secondary" className="text-[8px] tracking-tight">{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
