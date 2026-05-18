import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
prisma.employeeEvaluation.findMany({ include: { evaluator: true, employee: true, scores: true } }).then(r => console.dir(r, { depth: null })).finally(() => prisma.$disconnect())
