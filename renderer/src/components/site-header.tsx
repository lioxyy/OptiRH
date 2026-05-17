import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useLocation } from "react-router-dom"
import { NotificationBell } from "./layout/notification-bell"
import { ModeToggle } from "./mode-toggle"

const routeTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/employees": "Employees",
  "/dashboard/leave": "Leave",
  "/dashboard/contracts": "Contracts",
  "/dashboard/payroll": "Payroll",
  "/dashboard/tasks": "Tasks",
  "/dashboard/recruitment": "Recruitment",
  "/dashboard/evaluations": "Evaluations",
  "/dashboard/analytics": "Analytics",
}

export function SiteHeader() {
  const location = useLocation()
  const title = routeTitles[location.pathname] || "Dashboard"

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
      <div className="flex items-center gap-2 px-4 lg:px-6">
        <ModeToggle />
        <NotificationBell />
      </div>
    </header>
  )
}
