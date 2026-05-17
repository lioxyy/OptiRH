import express from 'express'
import cors from 'cors'
import { globalErrorHandler } from './lib/errors'
import { fail } from './lib/response'
import authRouter from './features/auth/auth.router'
import employeesRouter from './features/employees/employees.router'
import notificationsRouter from './features/notifications/notifications.router'
import auditRouter from './features/audit/audit.router'
import leavesRouter from './features/leaves/leaves.router'
import attendanceRouter from './features/attendance/attendance.router'
import absencesRouter from './features/absences/absences.router'
import contractsRouter from './features/contracts/contracts.router'
import massroufRouter from './features/massrouf/massrouf.router'
import payrollRouter from './features/payroll/payroll.router'
import settingsRouter from './features/settings/settings.router'

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
  app.use('/api/leaves', leavesRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/audit', auditRouter)
  app.use('/api/attendance', attendanceRouter)
  app.use('/api/absences', absencesRouter)
  app.use('/api/contracts', contractsRouter)
  app.use('/api/massrouf', massroufRouter)
  app.use('/api/payroll', payrollRouter)
  app.use('/api/settings', settingsRouter)

  app.use('/api/*', (_req, res) => {
    res.status(404).json(fail('NOT_FOUND', 'API route not found'))
  })

  app.use(globalErrorHandler)

  return app
}
