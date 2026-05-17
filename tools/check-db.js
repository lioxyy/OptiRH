require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const rows = await p.$queryRawUnsafe(
    'SELECT id_emp, name, date_birth, date_employment FROM "Employee"'
  )
  console.log('Employee rows:')
  console.log(JSON.stringify(rows, null, 2))

  for (const row of rows) {
    const birthOk = !row.date_birth || !isNaN(new Date(row.date_birth).getTime())
    const empOk   = !row.date_employment || !isNaN(new Date(row.date_employment).getTime())
    if (!birthOk || !empOk) {
      console.log(`\n!!! BAD ROW id_emp=${row.id_emp} name=${row.name}`)
      console.log('  date_birth      =', JSON.stringify(row.date_birth))
      console.log('  date_employment =', JSON.stringify(row.date_employment))
    }
  }
}

main()
  .then(() => p.$disconnect())
  .catch(e => { console.error(e.message, e.meta); p.$disconnect() })
