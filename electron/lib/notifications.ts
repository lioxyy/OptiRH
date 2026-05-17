import type { Prisma } from '@prisma/client'

export type NotificationType =
  | 'CONTRACT_EXPIRY'
  | 'LEAVE_PENDING'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'PAYROLL_GENERATED'
  | 'PAYROLL_PAID'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'EVALUATION_RECEIVED'

export async function createNotification(
  tx: Prisma.TransactionClient,
  recipientId: number,
  type: NotificationType,
  message: string,
  targetModel: string,
  targetId: number,
) {
  const now = new Date()

  const existing = await tx.notification.findFirst({
    where: {
      recipient_id: recipientId,
      type,
      target_model: targetModel,
      target_id: targetId,
      created_at: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    },
  })
  if (existing) return existing

  return tx.notification.create({
    data: {
      recipient_id: recipientId,
      type,
      message,
      target_model: targetModel,
      target_id: targetId,
    },
  })
}
