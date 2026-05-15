import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Bell } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'

interface Notification {
  id_notif: number
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await api.get('/api/notifications', { params: { is_read: 'false' } })
      return res.data.data
    },
    refetchInterval: 60000,
  })

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/notifications/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unreadCount = notifications.length

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <Card className="absolute right-0 top-full mt-1 w-80 z-20 max-h-96 overflow-y-auto shadow-lg">
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id_notif}
                    className="w-full text-left p-3 border-b last:border-0 hover:bg-accent text-sm"
                    onClick={() => markRead.mutate(n.id_notif)}
                  >
                    <p>{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
