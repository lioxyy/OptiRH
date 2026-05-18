import express from 'express'
import cors from 'cors'
import { globalErrorHandler } from './lib/errors'
import { fail } from './lib/response'
import authRouter from './features/auth/auth.router'
import employeesRouter from './features/employees/employees.router'
import notificationsRouter from './features/notifications/notifications.router'
import auditRouter from './features/audit/audit.router'
import evaluationsRouter from './features/evaluations/evaluations.router'
import recruitmentRouter from './features/recruitment/recruitment.router'

export function createApp() {
  const app = express()

  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? 'null'
      : 'http://localhost:5173',
    credentials: true,
  }))

  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRouter)
  app.use('/api/employees', employeesRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/audit', auditRouter)
  app.use('/api/evaluations', evaluationsRouter)
  app.use('/api/recruitment', recruitmentRouter)

  app.use('/api/*', (_req, res) => {
    res.status(404).json(fail('NOT_FOUND', 'API route not found'))
  })

  app.use(globalErrorHandler)

  return app
}
