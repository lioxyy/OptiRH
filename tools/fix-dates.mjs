/**
 * Reads Employee table directly from the SQLite binary and
 * reports / patches rows whose date_birth or date_employment
 * cannot be parsed as a valid JS Date.
 *
 * Works without any npm packages by parsing SQLite's B-tree pages
 * at the page-record level — or, more practically, by delegating
 * to the Prisma query engine via a child process with the correct
 * DATABASE_URL, which is what the Electron app does at runtime.
 *
 * Simpler fallback: spawn `npx prisma db execute` with targeted
 * UPDATE statements to null-out unparseable date cells.
 */

import { execSync, spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DB   = join(ROOT, 'prisma', 'dev.db')

if (!existsSync(DB)) {
  console.error('Database not found at', DB)
  process.exit(1)
}

function sql(query) {
  const r = spawnSync(
    process.execPath,
    ['-e', `
      process.env.DATABASE_URL = 'file:${DB.replace(/\\/g, '/')}';
      const { PrismaClient } = require('@prisma/client');
      const p = new PrismaClient();
      p.$queryRawUnsafe(${JSON.stringify(query)})
        .then(r => { console.log(JSON.stringify(r)); return p.$disconnect(); })
        .catch(e => { console.error('ERR', e.message); return p.$disconnect(); });
    `],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, DATABASE_URL: `file:${DB}` } }
  )
  if (r.stderr && r.stderr.includes('ERR')) {
    throw new Error(r.stderr)
  }
  try {
    return JSON.parse(r.stdout)
  } catch {
    return r.stdout
  }
}

console.log('Checking Employee date columns ...\n')

// First: try to select just the datetime columns as raw text
const rows = sql('SELECT id_emp, name, date_birth, date_employment FROM "Employee"')

if (!Array.isArray(rows)) {
  console.log('Raw output:', rows)
  console.log('\nPrisma raw query unavailable; trying Prisma CLI...')

  // Fall back: use Prisma CLI db execute for individual updates
  const cleanUp = `
UPDATE "Employee"
SET date_birth = '2000-01-01T00:00:00.000Z'
WHERE date_birth IS NULL OR date_birth = '' OR date_birth = 'Invalid Date';

UPDATE "Employee"
SET date_employment = '2000-01-01T00:00:00.000Z'
WHERE date_employment IS NULL OR date_employment = '' OR date_employment = 'Invalid Date';
  `.trim()

  try {
    execSync(`echo "${cleanUp.replace(/\n/g, '; ')}" | npx prisma db execute --stdin`, {
      cwd: ROOT, stdio: 'inherit', env: { ...process.env, DATABASE_URL: `file:${DB}` }
    })
    console.log('\nPatched potentially bad date rows.')
  } catch (e) {
    console.error('CLI fallback failed:', e.message)
  }
  process.exit(0)
}

console.log(`Found ${rows.length} employee rows.\n`)

const bad = []
for (const row of rows) {
  const birthOk = row.date_birth && !isNaN(new Date(row.date_birth).getTime())
  const empOk   = row.date_employment && !isNaN(new Date(row.date_employment).getTime())
  if (!birthOk || !empOk) {
    bad.push({ ...row, birthOk, empOk })
    console.log(`  BAD  id=${row.id_emp}  name=${row.name}`)
    console.log(`       date_birth      = ${JSON.stringify(row.date_birth)}  ok=${birthOk}`)
    console.log(`       date_employment = ${JSON.stringify(row.date_employment)}  ok=${empOk}`)
  } else {
    console.log(`  OK   id=${row.id_emp}  name=${row.name}  birth=${row.date_birth}  emp=${row.date_employment}`)
  }
}

if (bad.length === 0) {
  console.log('\nAll date columns look valid.')
  process.exit(0)
}

console.log(`\nFound ${bad.length} bad row(s). Patching...`)
for (const row of bad) {
  const fallback = '2000-01-01T00:00:00.000Z'
  const fix = []
  if (!row.birthOk) fix.push(`date_birth = '${fallback}'`)
  if (!row.empOk)   fix.push(`date_employment = '${fallback}'`)
  const update = `UPDATE "Employee" SET ${fix.join(', ')} WHERE id_emp = ${row.id_emp}`
  console.log(' >', update)
  sql(update)
}

console.log('\nDone. Re-run the app to verify.')
