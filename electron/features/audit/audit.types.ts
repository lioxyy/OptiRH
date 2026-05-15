import { z } from 'zod'
import { AuditQuerySchema } from './audit.schema'

export type AuditQuery = z.infer<typeof AuditQuerySchema>
