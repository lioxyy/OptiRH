import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { AppSidebar } from '../app-sidebar'
import { SiteHeader } from '../site-header'
import {
  SidebarProvider,
  SidebarInset,
} from '../ui/sidebar'

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

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/employees': 'Employees',
  '/dashboard/leave': 'Leave',
  '/dashboard/contracts': 'Contracts',
  '/dashboard/payroll': 'Payroll',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/recruitment': 'Recruitment',
  '/dashboard/evaluations': 'Evaluations',
  '/dashboard/analytics': 'Analytics',
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role))
  const pageTitle = pageTitles[location.pathname] || ''

  return (
    <SidebarProvider>
      <AppSidebar
        navItems={visibleItems}
        user={{ name: user.name, email: user.email, role: user.role }}
        onLogout={logout}
      />
      <SidebarInset>
        <SiteHeader title={pageTitle} role={user.role} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 lg:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
