import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Clock, CircleDot } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

import { api } from '../../lib/api'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'

interface Notification {
  id_notif: number
  type: string
  message: string
  is_read: boolean
  created_at: string
  target_model: string
  target_id: number
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const previousUnreadCountRef = useRef<number | null>(null)

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/api/notifications')
      return res.data.data
    },
    refetchInterval: 30000, // 30s polling as per plan
  })

  const unreadNotifications = notifications.filter(n => !n.is_read)
  const unreadCount = unreadNotifications.length

  // Toast logic for new notifications
  useEffect(() => {
    if (previousUnreadCountRef.current !== null && unreadCount > previousUnreadCountRef.current) {
      const latest = unreadNotifications[0]
      if (latest) {
        toast(latest.message, {
          description: formatDistanceToNow(new Date(latest.created_at)) + ' ago',
          icon: <Bell className="h-4 w-4" />,
        })
      }
    }
    previousUnreadCountRef.current = unreadCount
  }, [unreadCount, unreadNotifications])

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/notifications/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    }
  })

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <Bell className="h-5 w-5 transition-transform group-hover:rotate-12" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold border-2 border-background animate-in zoom-in"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4" align="end">
        <div className="flex items-center justify-between p-4 bg-muted/40">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold leading-none">Notifications</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread messages
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2 hover:text-primary"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[380px]">
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id_notif}
                  className={`relative flex gap-3 p-4 transition-colors hover:bg-accent/50 ${!notification.is_read ? 'bg-primary/5' : ''}`}
                >
                  {!notification.is_read && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
                      <CircleDot className="h-2 w-2 text-primary fill-primary" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className={`text-sm leading-tight ${!notification.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 lg:opacity-100"
                      onClick={() => markAsReadMutation.mutate(notification.id_notif)}
                      disabled={markAsReadMutation.isPending}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
