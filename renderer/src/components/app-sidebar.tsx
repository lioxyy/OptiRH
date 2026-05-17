"use client"

import * as React from "react"
import {
  CalendarCheckIcon,
  Command,
  LayoutDashboardIcon,
  UsersIcon,
  Building2Icon,
  FileTextIcon,
  WalletIcon,
  ListChecksIcon,
  UserPlusIcon,
  StarIcon,
  BarChart3Icon,
  LifeBuoy,
  Send,
  DatabaseIcon,
  FileIcon,
  ClipboardListIcon,
  UserCog2Icon,
  HeadsetIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
      isActive: true,
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
      icon: Building2Icon,
      roles: ["Admin", "Agent"],
    },
    {
      title: "Leave",
      url: "/dashboard/leave",
      icon: CalendarCheckIcon,
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
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3Icon,
      roles: ["Admin"],
    },
    {
      title: "Agents",
      url: "/dashboard/agents",
      icon: HeadsetIcon,
      roles: ["Admin"],
    },
    {
      title: "Admin Users",
      url: "/dashboard/admin-users",
      icon: UserCog2Icon,
      roles: ["Admin"],
    },
    {
      title: "Formations",
      url: "/dashboard/formations",
      icon: CalendarCheckIcon,
      roles: ["Admin", "Agent"],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: DatabaseIcon,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const role = (user?.role as Role) ?? "Employee"

  const filteredNavMain = data.navMain.filter((item) =>
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <NavMain items={filteredNavMain} />
        </SidebarGroup>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user?.name || "User", email: user?.email || "", avatar: "" }} onLogout={logout} />
      </SidebarFooter>
    </Sidebar>
  )
}
