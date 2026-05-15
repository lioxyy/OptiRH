import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { NotificationBell } from './notification-bell'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'

interface NavItem {
  label: string
  path: string
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Overview', path: '/dashboard', roles: ['Admin', 'Agent', 'Employee'] },
  { label: 'Employees', path: '/dashboard/employees', roles: ['Admin', 'Agent'] },
  { label: 'Leave', path: '/dashboard/leave', roles: ['Admin', 'Agent', 'Employee'] },
  { label: 'Contracts', path: '/dashboard/contracts', roles: ['Admin', 'Agent'] },
  { label: 'Payroll', path: '/dashboard/payroll', roles: ['Admin'] },
  { label: 'Tasks', path: '/dashboard/tasks', roles: ['Admin', 'Agent', 'Employee'] },
  { label: 'Recruitment', path: '/dashboard/recruitment', roles: ['Admin', 'Agent'] },
  { label: 'Evaluations', path: '/dashboard/evaluations', roles: ['Admin', 'Agent'] },
  { label: 'Analytics', path: '/dashboard/analytics', roles: ['Admin'] },
]

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r bg-card flex flex-col">
        <div className="p-4">
          <h2 className="text-lg font-bold">OptiRH</h2>
        </div>
        <Separator />
        <nav className="flex flex-col gap-1 p-2 flex-1">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-col flex-1">
        <header className="h-14 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user.name}</span>
            <Badge variant="secondary" className="text-xs">{user.role}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
