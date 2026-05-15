import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { AppSidebar } from '../app-sidebar'
import { NotificationBell } from './notification-bell'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '../ui/sidebar'
import { Separator } from '../ui/separator'

interface NavItem {
  key: string
  label: string
  path: string
  roles: string[]
}

const navItems: NavItem[] = [
  { key: 'overview', label: 'Overview', path: '/dashboard', roles: ['Admin', 'Agent', 'Employee'] },
  { key: 'employees', label: 'Employees', path: '/dashboard/employees', roles: ['Admin', 'Agent'] },
  { key: 'leave', label: 'Leave', path: '/dashboard/leave', roles: ['Admin', 'Agent', 'Employee'] },
  { key: 'contracts', label: 'Contracts', path: '/dashboard/contracts', roles: ['Admin', 'Agent'] },
  { key: 'payroll', label: 'Payroll', path: '/dashboard/payroll', roles: ['Admin'] },
  { key: 'tasks', label: 'Tasks', path: '/dashboard/tasks', roles: ['Admin', 'Agent', 'Employee'] },
  { key: 'recruitment', label: 'Recruitment', path: '/dashboard/recruitment', roles: ['Admin', 'Agent'] },
  { key: 'evaluations', label: 'Evaluations', path: '/dashboard/evaluations', roles: ['Admin', 'Agent'] },
  { key: 'analytics', label: 'Analytics', path: '/dashboard/analytics', roles: ['Admin'] },
]

export function DashboardLayout() {
  const { user, logout } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <SidebarProvider className="h-screen w-screen overflow-hidden">
      <AppSidebar
        navItems={visibleItems}
        user={{ name: user.name, email: user.email, role: user.role }}
        onLogout={logout}
      />
      <SidebarInset className="overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm text-muted-foreground">{user.role}</span>
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 min-w-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
