import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  Wallet,
  ListChecks,
  UserPlus,
  Star,
  BarChart3,
  type LucideIcon,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"

const iconMap: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  employees: Users,
  leave: CalendarCheck,
  contracts: FileText,
  payroll: Wallet,
  tasks: ListChecks,
  recruitment: UserPlus,
  evaluations: Star,
  analytics: BarChart3,
}

interface NavItem {
  key: string
  label: string
  path: string
  roles: string[]
}

interface AppSidebarProps {
  navItems: NavItem[]
  user: {
    name: string
    email: string
    role: string
  }
  onLogout: () => void
}

export function AppSidebar({ navItems, user, onLogout }: AppSidebarProps) {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            O
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">OptiRH</span>
            <span className="truncate text-xs text-muted-foreground">HR Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = iconMap[item.key]
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    tooltip={item.label}
                  >
                    <Link to={item.path}>
                      {Icon && <Icon />}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
