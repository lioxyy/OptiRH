"use client"

import * as React from "react"
import {
  CalendarCheckIcon,
  Command,
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  WalletIcon,
  ListChecksIcon,
  UserPlusIcon,
  StarIcon,
  BarChart3Icon,
  Building2,
  GraduationCap,
  Clock,
  PiggyBank,
  Receipt,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/auth-context"
import { Link } from "react-router-dom"

type Role = "Admin" | "Agent" | "Employee"

const navItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
    roles: ["Admin", "Agent", "Employee"],
  },
  {
    title: "Employees",
    url: "/dashboard/employees",
    icon: UsersIcon,
    roles: ["Admin", "Agent"],
  },
  {
    title: "Departments",
    url: "/dashboard/departments",
    icon: Building2,
    roles: ["Admin", "Agent"],
  },

  {
    title: "Leave",
    url: "/dashboard/leaves",
    icon: CalendarCheckIcon,
    roles: ["Admin", "Agent", "Employee"],
  },
  {
    title: "Attendance",
    url: "/dashboard/attendance",
    icon: Clock,
    roles: ["Admin", "Agent", "Employee"],
  },
  {
    title: "Contracts",
    url: "/dashboard/contracts",
    icon: FileTextIcon,
    roles: ["Admin", "Agent"],
  },
  {
    title: "Payroll",
    url: "/dashboard/payroll",
    icon: WalletIcon,
    roles: ["Admin"],
  },
  {
    title: "Payslips",
    url: "/dashboard/payslips",
    icon: Receipt,
    roles: ["Admin", "Agent", "Employee"],
  },
  {
    title: "Massrouf",
    url: "/dashboard/massrouf",
    icon: PiggyBank,
    roles: ["Admin", "Agent", "Employee"],
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: ListChecksIcon,
    roles: ["Admin", "Agent", "Employee"],
  },
  {
    title: "Recruitment",
    url: "/dashboard/recruitment",
    icon: UserPlusIcon,
    roles: ["Admin", "Agent"],
  },
  {
    title: "Evaluations",
    url: "/dashboard/evaluations",
    icon: StarIcon,
    roles: ["Admin", "Agent"],
  },
  {
    title: "Formations",
    url: "/dashboard/formations",
    icon: GraduationCap,
    roles: ["Admin", "Agent", "Employee"],
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3Icon,
    roles: ["Admin"],
  },
  {
    title: "Logs",
    url: "/dashboard/logs",
    icon: FileTextIcon,
    roles: ["Admin"],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const role = (user?.role as Role) ?? "Employee"

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(role)
  )

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">OptiRH</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <NavMain items={filteredNav} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user?.name || "User", email: user?.email || "", avatar: "" }} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
