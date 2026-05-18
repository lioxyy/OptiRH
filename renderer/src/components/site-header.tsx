import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "./layout/notification-bell"
import { useLocation } from "react-router-dom"

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':              'Overview',
  '/dashboard/employees':    'Employees',
  '/dashboard/leave':        'Leave Management',
  '/dashboard/attendance':   'Attendance',
  '/dashboard/massrouf':     'Salary Advances',
  '/dashboard/contracts':    'Contracts',
  '/dashboard/payroll':      'Payroll Administration',
  '/dashboard/payslips':     'My Payslips',
  '/dashboard/tasks':        'Tasks',
  '/dashboard/recruitment':  'Recruitment',
  '/dashboard/evaluations':  'Evaluations',
  '/dashboard/analytics':    'Analytics',
  '/dashboard/profile':      'My Profile',
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'OptiRH'

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        {/* Push notification bell to the right */}
        <div className="ml-auto relative">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
