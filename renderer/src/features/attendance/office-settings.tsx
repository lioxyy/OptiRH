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
    <Card className="border-primary/5 bg-card/40 backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-300 hover:border-primary/10">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted/50 rounded-xl flex items-center justify-center border border-border/10">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">System Parameters</CardTitle>
            <CardDescription className="text-xs">Configure global parameters governing pointage and lateness detection.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Lateness Threshold Parameter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/10 bg-muted/5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground/60" />
                Office Start Time
              </label>
              <span className="text-[10px] text-muted-foreground block max-w-[300px]">
                Any clock-in recorded past this threshold will be flagged as Late.
              </span>
            </div>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-10 w-32 text-sm font-mono rounded-lg border-border/20 bg-background focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* Informative Tip Banner */}
        <div className="flex gap-3 p-4 rounded-xl border border-border/10 bg-muted/10 text-[11px] text-muted-foreground leading-relaxed">
          <Lightbulb className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-foreground block mb-1 uppercase tracking-wider">System Behavior Notice</span>
            Changing this value will immediately re-configure pointage thresholds. Pre-existing records will not be mutated historically, but all future clock-ins will respect the new limit.
          </div>
        </div>

        {/* Save Actions Button */}
        <div className="pt-4 flex items-center justify-between border-t border-border/10">
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/40" />
            Administrative scope
          </div>

          <Button
            className="bg-foreground text-background hover:bg-foreground/90 rounded-xl h-10 text-xs font-bold px-6 gap-2 shadow-sm transition-all duration-200"
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
