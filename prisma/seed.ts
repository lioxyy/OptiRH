import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existingTypes = await prisma.leaveType.findMany()
  if (existingTypes.length === 0) {
    await prisma.leaveType.createMany({
      data: [
        { name: 'Annual Leave', default_days: 30 },
        { name: 'Sick Leave', default_days: 15 },
        { name: 'Maternity Leave', default_days: 90 },
        { name: 'Unpaid Leave', default_days: 0 },
      ],
    })
  }

  const dept = await prisma.department.upsert({
    where: { id_dept: 1 },
    update: {},
    create: { name: 'General', description: 'Default department' },
  })

  const hash = await bcrypt.hash('admin123', 10)
  await prisma.employee.upsert({
    where: { email: 'admin@optirh.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@optirh.com',
      password_hash: hash,
      role: 'Admin',
      date_birth: new Date('1990-01-01'),
      date_employment: new Date(),
      id_dept: dept.id_dept,
    },
  })

  console.log('Seed complete. Admin: admin@optirh.com / admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
