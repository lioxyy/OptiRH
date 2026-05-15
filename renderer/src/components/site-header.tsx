import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/layout/notification-bell"
import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

interface SiteHeaderProps {
  title?: string
  role?: string
  children?: ReactNode
}

export function SiteHeader({ title, role, children }: SiteHeaderProps) {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            {title && <h1 className="text-base font-medium">{title}</h1>}
            {role && <Badge variant="secondary" className="text-xs">{role}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {children}
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  )
}
