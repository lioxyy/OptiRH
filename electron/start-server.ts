import * as path from 'path'
import { createApp } from './server'

const DEFAULT_PORT = 3001

// Reconcile and resolve database paths
const dbPath = path.resolve(__dirname, '../prisma/dev.db')
process.env.DATABASE_URL = `file:${dbPath}`

console.log(`📂 Standalone Database Path: ${dbPath}`)
console.log(`🔗 Environment DATABASE_URL: ${process.env.DATABASE_URL}`)

const app = createApp()

function startServer(port: number) {
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`🚀 [OptiRH Standalone Backend] Running on http://127.0.0.1:${port}`)
    if (port !== DEFAULT_PORT) {
      console.log(`\n⚠️  Port ${DEFAULT_PORT} was already in use! Automatically switched to port ${port}.`)
      console.log(`👉 To connect the browser frontend to this standalone server, visit:`)
      console.log(`   http://localhost:5173/?port=${port}\n`)
    }
  })

  // Catch address in use and try the next incremental port
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} is occupied, trying next port ${port + 1}...`)
      startServer(port + 1)
    } else {
      console.error('❌ Fatal Standalone Server Error:', err)
    }
  })
}

// Support custom port injection via process.env.PORT, otherwise default to 3001
const startPort = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT
startServer(startPort)
