import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const emp = await prisma.employee.create({
    data: {
      name: 'Admin User',
      email: 'admin@optirh.dz',
      password_hash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', // password123
      phone: '0550000000',
      gender: 'Male',
      date_birth: new Date('1985-01-01'),
      date_employment: new Date('2020-01-01'),
      role: 'Admin'
    }
  })
  console.log('Created Admin successfully:', emp)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
