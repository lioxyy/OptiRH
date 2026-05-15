import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { NotificationBell } from "@/components/layout/notification-bell"

interface SiteHeaderProps {
  pageTitle?: string
  role?: string
}

export function SiteHeader({ pageTitle, role }: SiteHeaderProps) {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            {pageTitle && <h1 className="text-base font-medium">{pageTitle}</h1>}
            {role && <Badge variant="secondary" className="text-xs">{role}</Badge>}
          </div>
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
