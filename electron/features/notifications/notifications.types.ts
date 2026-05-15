import { z } from 'zod'
import { NotificationParamsSchema } from './notifications.schema'

export type NotificationParams = z.infer<typeof NotificationParamsSchema>
