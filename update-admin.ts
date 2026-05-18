import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password123', 10)
  const emp = await prisma.employee.update({
    where: { email: 'admin@optirh.dz' },
    data: { password_hash: hash }
  })
  console.log('Updated Admin password successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
