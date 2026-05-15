import type { Prisma } from '@prisma/client'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'GENERATE'

export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  actorId: number,
  action: AuditAction,
  targetModel: string,
  targetId: number,
  snapshot: object,
) {
  return tx.auditLog.create({
    data: {
      actor_id: actorId,
      action,
      target_model: targetModel,
      target_id: targetId,
      snapshot: JSON.stringify(snapshot),
    },
  })
}
