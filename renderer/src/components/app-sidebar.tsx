"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarCheckIcon,
  FileTextIcon,
  WalletIcon,
  ListChecksIcon,
  UserPlusIcon,
  StarIcon,
  BarChart3Icon,
  SettingsIcon,
  HelpCircleIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/auth-context"

type Role = "Admin" | "Agent" | "Employee"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

const navItems: Record<Role, NavItem[]> = {
  Admin: [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboardIcon },
    { title: "Employees", url: "/dashboard/employees", icon: UsersIcon },
    { title: "Leave", url: "/dashboard/leave", icon: CalendarCheckIcon },
    { title: "Contracts", url: "/dashboard/contracts", icon: FileTextIcon },
    { title: "Payroll", url: "/dashboard/payroll", icon: WalletIcon },
    { title: "Tasks", url: "/dashboard/tasks", icon: ListChecksIcon },
    { title: "Recruitment", url: "/dashboard/recruitment", icon: UserPlusIcon },
    { title: "Evaluations", url: "/dashboard/evaluations", icon: StarIcon },
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3Icon },
  ],
  Agent: [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboardIcon },
    { title: "Employees", url: "/dashboard/employees", icon: UsersIcon },
    { title: "Leave", url: "/dashboard/leave", icon: CalendarCheckIcon },
    { title: "Contracts", url: "/dashboard/contracts", icon: FileTextIcon },
    { title: "Tasks", url: "/dashboard/tasks", icon: ListChecksIcon },
    { title: "Recruitment", url: "/dashboard/recruitment", icon: UserPlusIcon },
    { title: "Evaluations", url: "/dashboard/evaluations", icon: StarIcon },
  ],
  Employee: [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboardIcon },
    { title: "Leave", url: "/dashboard/leave", icon: CalendarCheckIcon },
    { title: "Tasks", url: "/dashboard/tasks", icon: ListChecksIcon },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const role = (user?.role as Role) ?? "Employee"
  const items = navItems[role]

  return (
    <Sidebar collapsible="icon" {...props}>
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
        <NavMain items={items} />
        <NavSecondary
          items={[
            { title: "Settings", url: "#", icon: SettingsIcon },
            { title: "Get Help", url: "#", icon: HelpCircleIcon },
          ]}
          className="mt-auto"
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ name: user?.name ?? "", email: user?.email ?? "" }} onLogout={logout} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
