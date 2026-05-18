import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Bell, CalendarCheck, CalendarX, Clock4, Wallet,
  FileText, CheckCheck, X
} from 'lucide-react'

interface Notification {
  id_notif: number
  type: string
  message: string
  is_read: boolean
  created_at: string
  target_model?: string
}

// Per-type visual config
const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; iconColor: string; label: string }> = {
  LEAVE_PENDING:    { icon: Clock4,        bg: 'bg-amber-500/10',  iconColor: 'text-amber-400',  label: 'Leave Pending'  },
  LEAVE_APPROVED:   { icon: CalendarCheck, bg: 'bg-emerald-500/10',iconColor: 'text-emerald-400',label: 'Leave Approved' },
  LEAVE_REJECTED:   { icon: CalendarX,     bg: 'bg-rose-500/10',   iconColor: 'text-rose-400',   label: 'Leave Rejected' },
  PAYROLL_GENERATED:{ icon: Wallet,        bg: 'bg-blue-500/10',   iconColor: 'text-blue-400',   label: 'Payroll'        },
  CONTRACT_EXPIRY:  { icon: FileText,      bg: 'bg-orange-500/10', iconColor: 'text-orange-400', label: 'Contract'       },
}

const DEFAULT_CONFIG = { icon: Bell, bg: 'bg-muted/40', iconColor: 'text-muted-foreground', label: 'Notification' }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: allNotifs = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', 'all'],
    queryFn: async () => {
      const res = await api.get('/api/notifications')
      return res.data.data
    },
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: async (id: number) => api.patch(`/api/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = allNotifs.filter(n => !n.is_read)
      await Promise.all(unread.map(n => api.patch(`/api/notifications/${n.id_notif}`)))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = allNotifs.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 rounded-xl hover:bg-muted/60 transition-all"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4.5 w-4.5 p-0 flex items-center justify-center text-[10px] bg-rose-500 hover:bg-rose-500 rounded-full border-2 border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 z-20 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-rose-500/20 text-rose-400 border-rose-500/20 rounded-full">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2 rounded-lg"
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border/10">
              {allNotifs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <Bell className="h-8 w-8 mx-auto opacity-20" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs opacity-60">No notifications yet.</p>
                </div>
              ) : (
                allNotifs.map((n) => {
                  const cfg = TYPE_CONFIG[n.type] ?? DEFAULT_CONFIG
                  const Icon = cfg.icon
                  return (
                    <button
                      key={n.id_notif}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-all hover:bg-muted/30 ${
                        !n.is_read ? 'bg-primary/3' : 'opacity-70'
                      }`}
                      onClick={() => { if (!n.is_read) markRead.mutate(n.id_notif) }}
                    >
                      {/* Type icon */}
                      <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-lg ${cfg.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.iconColor}`}>
                            {cfg.label}
                          </span>
                          {!n.is_read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-foreground leading-snug line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {allNotifs.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border/10 text-center">
                <span className="text-[11px] text-muted-foreground/60">
                  {allNotifs.length} notification{allNotifs.length !== 1 ? 's' : ''} total
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
