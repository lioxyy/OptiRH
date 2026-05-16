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

  /* ── Vue Employé ────────────────────────────────────────────── */
  if (!isManager) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mes Congés</h1>
          <LeaveRequestForm />
        </div>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">Mes demandes</TabsTrigger>
            <TabsTrigger value="balances">Mes soldes</TabsTrigger>
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

  /* ── Vue Admin / Agent ──────────────────────────────────────── */
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gestion des Congés</h1>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Toutes les demandes</TabsTrigger>
          {isAdmin && <TabsTrigger value="types">Types de congé</TabsTrigger>}
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
