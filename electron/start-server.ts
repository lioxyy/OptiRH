import * as path from 'path'
import { createApp } from './server'

const port = 3001

// Reconcile and resolve database paths
const dbPath = path.resolve(__dirname, '../prisma/dev.db')
process.env.DATABASE_URL = `file:${dbPath}`

console.log(`📂 Standalone Database Path: ${dbPath}`)
console.log(`🔗 Environment DATABASE_URL: ${process.env.DATABASE_URL}`)

const app = createApp()
app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 [OptiRH Standalone Backend] Running on http://127.0.0.1:${port}`)
})
