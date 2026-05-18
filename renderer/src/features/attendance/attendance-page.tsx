import { useAuth } from '../../context/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { ClockInOut } from './clock-in-out'
import { AttendanceHistory } from './attendance-history'
import { DailyRoster } from './daily-roster'
import { OfficeSettings } from './office-settings'
import { CalendarCheck2, Users, Settings2 } from 'lucide-react'

export function AttendancePage() {
  const { user } = useAuth()
  const isManager = user?.role === 'Admin' || user?.role === 'Agent'

  /* ── Employee View ────────────────────────────────────────────── */
  if (!isManager) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Daily Attendance & Pointage
          </h1>
          <p className="text-muted-foreground text-sm">
            Record your daily office entry, exit, or view your history logs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Clock In / Clock Out panel */}
          <div className="lg:col-span-1">
            <ClockInOut />
          </div>

          {/* History logs panel */}
          <div className="lg:col-span-2">
            <AttendanceHistory />
          </div>
        </div>
      </div>
    )
  }

  /* ── Admin / Agent View ──────────────────────────────────────── */
  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          Attendance Administration Hub
        </h1>
        <p className="text-muted-foreground text-sm">
          Monitor today's office roster, handle manual corrections, and configure attendance rules.
        </p>
      </div>

      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="roster" className="rounded-lg gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Today's Roster
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2 text-sm font-medium">
            <CalendarCheck2 className="h-4 w-4" />
            Attendance History
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4" />
            Attendance Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-4 outline-none">
          <DailyRoster />
        </TabsContent>

        <TabsContent value="history" className="mt-4 outline-none">
          <div className="max-w-4xl">
            <AttendanceHistory />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 outline-none">
          <div className="max-w-xl">
            <OfficeSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
