import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "./layout/notification-bell"
import { ModeToggle } from "./mode-toggle"
import { DynamicBreadcrumb } from "./layout/dynamic-breadcrumb"

export function SiteHeader() {

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <DynamicBreadcrumb />
      </div>
      <div className="flex items-center gap-2 px-4 lg:px-6">
        <ModeToggle />
        <NotificationBell />
      </div>
    </header>
  )
}
