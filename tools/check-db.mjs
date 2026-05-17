import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, '..', 'prisma', 'dev.db')

// SQLite file layout: page 1 starts at offset 0
// We'll parse the raw bytes to find string cells that look like bad dates.
// Much simpler: just look for "Invalid Date" or empty datetime strings by grepping the raw bytes.
const buf = readFileSync(dbPath)
const text = buf.toString('utf8', 0, buf.length)

// Search for "Invalid Date" string in the binary
const invalidDateIdx = text.indexOf('Invalid Date')
if (invalidDateIdx !== -1) {
  console.log('FOUND "Invalid Date" at byte offset', invalidDateIdx)
} else {
  console.log('No "Invalid Date" string found in DB file.')
}

// Also look for empty-string datetime sentinels
const patterns = ['Invalid Date', '\x00\x00\x00\x00', '0000-00-00']
for (const p of patterns) {
  const idx = buf.indexOf(p)
  if (idx !== -1) console.log(`Pattern "${p}" found at offset ${idx}`)
}

console.log('DB file size:', buf.length, 'bytes')
console.log('DB path used:', dbPath)
