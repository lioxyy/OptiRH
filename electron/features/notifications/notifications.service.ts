import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'

export async function getNotifications(userId: number, isRead?: string) {
  const where: any = { recipient_id: userId }
  if (isRead === 'true') where.is_read = true
  if (isRead === 'false') where.is_read = false

  return prisma.notification.findMany({
    where,
    orderBy: { created_at: 'desc' },
  })
}

export async function markAsRead(notificationId: number, userId: number) {
  const notification = await prisma.notification.findUnique({
    where: { id_notif: notificationId },
  })
  if (!notification) throw new AppError('NOT_FOUND', 404)
  if (notification.recipient_id !== userId) throw new AppError('FORBIDDEN', 403)

  return prisma.notification.update({
    where: { id_notif: notificationId },
    data: { is_read: true },
  })
}

export async function markAllAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: {
      recipient_id: userId,
      is_read: false,
    },
    data: { is_read: true },
  })
}
