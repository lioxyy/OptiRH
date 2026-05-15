import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/errors'

type Role = 'Admin' | 'Agent' | 'Employee'

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) return next(new AppError('FORBIDDEN', 403))
    next()
  }
}
