import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Outlet, Navigate } from 'react-router-dom'
import { AppSidebar } from '../app-sidebar'
import { SiteHeader } from '../site-header'
import { TitleBar } from '../title-bar'
import { useAuth } from '@/context/auth-context'
import { ScrollArea } from '@/components/ui/scroll-area'

export function DashboardLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen w-full flex-col bg-sidebar overflow-hidden">
      <TitleBar />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden">
          <SiteHeader />
          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-1 flex-col gap-4 p-4">
              <Outlet />
            </div>
          </ScrollArea>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
