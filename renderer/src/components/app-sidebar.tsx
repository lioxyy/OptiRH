"use client"

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
  HelpCircleIcon,
  SettingsIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
import { Link } from "react-router-dom"

const iconMap: Record<string, LucideIcon> = {
  overview: LayoutDashboardIcon,
  employees: UsersIcon,
  leave: CalendarCheckIcon,
  contracts: FileTextIcon,
  payroll: WalletIcon,
  tasks: ListChecksIcon,
  recruitment: UserPlusIcon,
  evaluations: StarIcon,
  analytics: BarChart3Icon,
}

interface NavItem {
  key: string
  label: string
  path: string
  roles: string[]
}

interface AppSidebarProps {
  navItems: NavItem[]
  user: { name: string; email: string; role: string }
  onLogout: () => void
}

export function AppSidebar({ navItems, user, onLogout, ...props }: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const mainNavItems = navItems.map((item) => ({
    title: item.label,
    url: item.path,
    icon: iconMap[item.key],
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/dashboard">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                  O
                </span>
                <span className="text-base font-semibold">OptiRH</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavItems} />
        <NavSecondary
          items={[
            { title: "Settings", url: "#", icon: SettingsIcon },
            { title: "Get Help", url: "#", icon: HelpCircleIcon },
          ]}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
