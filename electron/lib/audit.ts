import type { PrismaClient } from '@prisma/client'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'GENERATE'

export async function writeAuditLog(
  tx: PrismaClient | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  actorId: number,
  action: AuditAction,
  targetModel: string,
  targetId: number,
  snapshot: object,
) {
  return (tx as any).auditLog.create({
    data: { actor_id: actorId, action, target_model: targetModel, target_id: targetId, snapshot },
  })
}
