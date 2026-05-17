export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EMPLOYEE_NOT_FOUND: 'EMPLOYEE_NOT_FOUND',
  DEPARTMENT_NOT_FOUND: 'DEPARTMENT_NOT_FOUND',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  NO_ACTIVE_CONTRACT: 'NO_ACTIVE_CONTRACT',
  LEAVE_NOT_FOUND: 'LEAVE_NOT_FOUND',
  LEAVE_OVERLAP: 'LEAVE_OVERLAP',
  LEAVE_OVER_ALLOCATION: 'LEAVE_OVER_ALLOCATION',
  LEAVE_INVALID_STATUS: 'LEAVE_INVALID_STATUS',
  CANDIDATE_NOT_FOUND: 'CANDIDATE_NOT_FOUND',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  EVALUATION_NOT_FOUND: 'EVALUATION_NOT_FOUND',
  PAYROLL_ALREADY_GENERATED: 'PAYROLL_ALREADY_GENERATED',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(code)
    this.name = 'AppError'
  }
}

import type { Request, Response, NextFunction } from 'express'
import { fail } from './response'

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(fail(err.code, err.code, err.details))
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const prismaErr = err as { code: string; meta?: unknown }
    if (prismaErr.code === 'P2002') {
      return res.status(409).json(fail('CONFLICT', 'Unique constraint violation', prismaErr.meta))
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json(fail('NOT_FOUND', 'Record not found'))
    }
    if (prismaErr.code === 'P2023') {
      console.error(
        '[DB] P2023: DateTime column contains non-ISO value (SQLite CURRENT_TIMESTAMP format).\n' +
        '     Run: npm run fix-db   to normalise all DATETIME columns.',
      )
      return res.status(500).json(fail('INTERNAL_ERROR', 'Database date format error. Run: npm run fix-db'))
    }
  }

  console.error('[Unhandled Error]', err)
  return res.status(500).json(fail('INTERNAL_ERROR', 'An unexpected error occurred'))
}
