"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
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
  DatabaseIcon,
  ClipboardListIcon,
  FileIcon,
  LogOutIcon,
  ChevronsUpDownIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Role = "Admin" | "Agent" | "Employee"

interface NavItem {
  title: string
  url: string
  icon: React.ElementType
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
  const location = useLocation()
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

        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { name: "Data Library", url: "#", icon: DatabaseIcon },
                { name: "Reports", url: "#", icon: ClipboardListIcon },
                { name: "Word Assistant", url: "#", icon: FileIcon },
              ].map((doc) => (
                <SidebarMenuItem key={doc.name}>
                  <SidebarMenuButton asChild>
                    <Link to={doc.url}>
                      <doc.icon />
                      <span>{doc.name}</span>
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
                  <Link to="#">
                    <SettingsIcon />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Get Help">
                  <Link to="#">
                    <HelpCircleIcon />
                    <span>Get Help</span>
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
                      {user?.name?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width]"
                side="top"
                align="start"
              >
                <DropdownMenuItem onClick={logout}>
                  <LogOutIcon className="mr-2 h-4 w-4" />
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
