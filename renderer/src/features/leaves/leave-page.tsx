import { useAuth } from '../../context/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { LeaveBalanceCards } from './leave-balance-cards'
import { LeaveRequestForm } from './leave-request-form'
import { LeaveRequestsTable } from './leave-requests-table'
import { LeaveTypeManager } from './leave-type-manager'

export function LeavePage() {
  const { user } = useAuth()
  const isManager = user?.role === 'Admin' || user?.role === 'Agent'
  const isAdmin = user?.role === 'Admin'

  /* ── Employee View ────────────────────────────────────────────── */
  if (!isManager) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Leaves</h1>
          <LeaveRequestForm />
        </div>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">My Requests</TabsTrigger>
            <TabsTrigger value="balances">My Balances</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-4">
            <LeaveRequestsTable />
          </TabsContent>

          <TabsContent value="balances" className="mt-4">
            <LeaveBalanceCards />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  /* ── Admin / Agent View ──────────────────────────────────────── */
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Leave Management</h1>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">All Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="types">Leave Types</TabsTrigger>}
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <LeaveRequestsTable />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="types" className="mt-4">
            <LeaveTypeManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
