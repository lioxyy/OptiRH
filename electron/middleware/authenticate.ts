import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/auth'
import { AppError } from '../lib/errors'
import { prisma } from '../db/client'

export interface RequestUser {
  id_emp: number
  role: 'Admin' | 'Agent' | 'Employee'
  id_dept: number
}

declare global {
  namespace Express {
    interface Request {
      user: RequestUser
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next(new AppError('UNAUTHORIZED', 401))

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) return next(new AppError('INVALID_TOKEN', 401))

  const employee = await prisma.employee.findUnique({
    where: { id_emp: payload.id_emp },
    select: { id_emp: true, role: true, id_dept: true },
  })

  if (!employee) return next(new AppError('UNAUTHORIZED', 401))

  req.user = employee as RequestUser
  next()
}
