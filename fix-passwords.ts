import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password123', 10)
  await prisma.employee.updateMany({
    data: { password_hash: hash }
  })
  console.log('Updated all passwords to password123 successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
