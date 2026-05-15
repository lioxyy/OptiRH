import express from 'express'
import cors from 'cors'
import { globalErrorHandler } from './lib/errors'
import { fail } from './lib/response'

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

  app.use('/api/*', (_req, res) => {
    res.status(404).json(fail('NOT_FOUND', 'API route not found'))
  })

  app.use(globalErrorHandler)

  return app
}
