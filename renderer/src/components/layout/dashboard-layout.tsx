import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Outlet, Navigate } from 'react-router-dom'
import { AppSidebar } from '../app-sidebar'
import { SiteHeader } from '../site-header'
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
    <SidebarProvider className="h-full w-full flex overflow-hidden bg-background">
      <AppSidebar />
      <SidebarInset className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 p-4 lg:p-6 pb-20 lg:pb-24">
              <Outlet />
            </div>
          </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
