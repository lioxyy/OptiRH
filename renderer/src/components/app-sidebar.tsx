"use client"

import * as React from "react"
import {
  Command,
  LayoutDashboardIcon,
  UsersIcon,
  WalletIcon,
  Clock,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/auth-context"
import { Link } from "react-router-dom"

type Role = "Admin" | "Agent" | "Employee"

const navGroups = [
  {
    title: "Core Intelligence",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
    roles: ["Admin", "Agent", "Employee"],
    items: [
      { title: "Overview", url: "/dashboard" },
      { title: "Audit Logs", url: "/dashboard/logs", roles: ["Admin"] },
    ],
  },
  {
    title: "Workforce",
    url: "/dashboard/employees",
    icon: UsersIcon,
    roles: ["Admin", "Agent"],
    items: [
      { title: "Employees", url: "/dashboard/employees" },
      { title: "Departments", url: "/dashboard/departments" },
      { title: "Recruitment", url: "/dashboard/recruitment" },
      { title: "Evaluations", url: "/dashboard/evaluations" },
    ],
  },
  {
    title: "Operations",
    url: "/dashboard/attendance",
    icon: Clock,
    roles: ["Admin", "Agent", "Employee"],
    items: [
      { title: "Attendance Tracking", url: "/dashboard/attendance" },
      { title: "Leave Management", url: "/dashboard/leaves" },
      { title: "Task Boards", url: "/dashboard/tasks" },
      { title: "Training Hub", url: "/dashboard/formations" },
    ],
  },
  {
    title: "Finance & Admin",
    url: "/dashboard/payroll",
    icon: WalletIcon,
    roles: ["Admin", "Agent", "Employee"],
    items: [
      { title: "Payroll Management", url: "/dashboard/payroll", roles: ["Admin"] },
      { title: "Massrouf (Advances)", url: "/dashboard/massrouf" },
      { title: "Contract Archive", url: "/dashboard/contracts" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const role = (user?.role as Role) ?? "Employee"

  // Filter groups and items based on role
  const filteredGroups = navGroups
    .filter((group) => group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !("roles" in item) || (item.roles as string[]).includes(role)
      ),
    }))

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
      <SidebarContent className="overflow-y-auto scrollbar-none">
        <NavMain items={filteredGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user?.name || "User", email: user?.email || "", avatar: "" }} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
