import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard, Users, Calendar, FileText,
  DollarSign, CheckSquare, UserPlus, Star,
  BarChart3, Settings,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDown, LogOut } from 'lucide-react'

type Role = 'Admin' | 'Agent' | 'Employee'

const navItems: Record<Role, { title: string; url: string; icon: React.ElementType }[]> = {
  Admin: [
    { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Employees', url: '/dashboard/employees', icon: Users },
    { title: 'Leave', url: '/dashboard/leave', icon: Calendar },
    { title: 'Contracts', url: '/dashboard/contracts', icon: FileText },
    { title: 'Payroll', url: '/dashboard/payroll', icon: DollarSign },
    { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquare },
    { title: 'Recruitment', url: '/dashboard/recruitment', icon: UserPlus },
    { title: 'Evaluations', url: '/dashboard/evaluations', icon: Star },
    { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
  ],
  Agent: [
    { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Employees', url: '/dashboard/employees', icon: Users },
    { title: 'Leave', url: '/dashboard/leave', icon: Calendar },
    { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquare },
    { title: 'Recruitment', url: '/dashboard/recruitment', icon: UserPlus },
    { title: 'Evaluations', url: '/dashboard/evaluations', icon: Star },
  ],
  Employee: [
    { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Leave', url: '/dashboard/leave', icon: Calendar },
    { title: 'Tasks', url: '/dashboard/tasks', icon: CheckSquare },
  ],
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const items = navItems[user?.role ?? 'Employee']

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-sm font-bold">O</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">OptiRH</span>
                  <span className="truncate text-xs text-muted-foreground">HR Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link to="/dashboard/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width]"
                side="top"
                align="start"
              >
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
