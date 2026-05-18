import { prisma } from '../../db/client'
import { AppError } from '../../lib/errors'

export async function getAuditLogs(filters: {
  target_model?: string
  actor_id?: number
  from?: string
  to?: string
  page: number
  limit: number
}) {
  const where: any = {}

  if (filters.target_model) where.target_model = filters.target_model
  if (filters.actor_id) where.actor_id = filters.actor_id
  if (filters.from || filters.to) {
    where.timestamp = {}
    if (filters.from) where.timestamp.gte = new Date(filters.from)
    if (filters.to) where.timestamp.lte = new Date(filters.to)
  }

  const skip = (filters.page - 1) * filters.limit

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: filters.limit,
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return { data, total, page: filters.page, limit: filters.limit }
}
