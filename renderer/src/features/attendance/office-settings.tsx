import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { toast } from 'sonner'
import { Settings, ShieldCheck, Clock, Lightbulb } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'

interface SettingItem {
  id: number
  key: string
  value: string
}

export function OfficeSettings() {
  const queryClient = useQueryClient()
  const [startTime, setStartTime] = useState('09:00')

  // Fetch all global settings
  const { data: settings = [], isLoading } = useQuery<SettingItem[]>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/api/settings')
      return res.data.data
    },
  })

  // Synchronize state when settings are loaded
  useEffect(() => {
    const officeStartSetting = settings.find((s) => s.key === 'office_start_time')
    if (officeStartSetting) {
      setStartTime(officeStartSetting.value)
    }
  }, [settings])

  // Update Setting Mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await api.post('/api/settings', { key, value })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Office start time updated successfully!')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Could not update settings'
      toast.error(msg)
    },
  })

  const handleSave = () => {
    updateSettingMutation.mutate({
      key: 'office_start_time',
      value: startTime,
    })
  }

  if (isLoading) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-400 animate-spin-slow" />
          Attendance & Chrono Configurations
        </CardTitle>
        <CardDescription>Configure global parameters governing pointage and lateness detection.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Lateness Threshold Parameter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Office Start Time
              </label>
              <span className="text-xs text-muted-foreground block">
                Any clock-in recorded past this threshold will be flagged as Late.
              </span>
            </div>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-9 w-28 text-xs font-mono rounded-lg border-border/60 focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        {/* Informative Tip Banner */}
        <div className="flex gap-2.5 p-3.5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-xs text-muted-foreground leading-normal">
          <Lightbulb className="h-5 w-5 text-indigo-400 shrink-0" />
          <div>
            <span className="font-semibold text-foreground block mb-0.5">Lateness Calculation Tip</span>
            Changing this value will immediately re-configure pointage thresholds. Pre-existing records will not be mutated historically, but all future clock-ins will respect the new limit.
          </div>
        </div>

        {/* Save Actions Button */}
        <div className="pt-2 flex items-center justify-between border-t border-border/10">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Administrative scope
          </div>

          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-xs px-4 gap-1 shadow-md hover:shadow-lg transition-all duration-200"
            onClick={handleSave}
            disabled={updateSettingMutation.isPending}
          >
            {updateSettingMutation.isPending ? 'Updating...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
