import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { NotificationBell } from './notification-bell'

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

  if (!user) return null

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r flex flex-col p-4">
        <h2 className="text-lg font-bold mb-6">OptiRH</h2>
        <nav className="flex flex-col gap-1 flex-1">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded text-sm ${
                location.pathname === item.path ? 'bg-muted font-medium' : 'hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-col flex-1">
        <header className="h-14 border-b flex items-center justify-between px-6">
          <span className="text-sm text-muted-foreground">
            {user.name}
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted">{user.role}</span>
          </span>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground">
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
